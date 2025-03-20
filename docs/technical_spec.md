# Recipe App Technical Specification

## 1. Introduction

This technical specification details the implementation approach for the Recipe App, with a particular focus on the database schema, API design, testing strategy, and deployment pipeline. The document is structured to support an integrated four-phase development approach, allowing for incremental implementation while maintaining focus on professional development practices.

## 2. Database Schema Design

The database schema will evolve through four distinct phases, each building upon the previous one to add functionality while maintaining backward compatibility.

### 2.1 Phase 1: Foundation (Backend Focus)

#### Core Entities

The Phase 1 schema focuses on establishing the fundamental data model required for basic recipe management.

##### Recipe Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for recipe |
| name | String | Unique, Required | Recipe name |
| description | String | Optional | Recipe description |
| servings | Integer | Default: 1 | Number of servings recipe produces |
| prepTime | Integer | Optional | Preparation time in minutes |
| cookTime | Integer | Optional | Cooking time in minutes |
| instructions | Text | Optional | Simple text-based instructions for MVP |
| createdAt | DateTime | Auto: current time | When recipe was created |
| updatedAt | DateTime | Auto: update | When recipe was last updated |
| deletedAt | DateTime | Optional | Soft deletion timestamp |
| previousVersion | JSON | Optional | For versioning and reverting |

##### Ingredient Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for ingredient |
| name | String | Unique, Required | Ingredient name |
| normalizedName | String | Unique, Required | Lowercase, no spaces for matching |
| createdAt | DateTime | Auto: current time | When ingredient was created |
| updatedAt | DateTime | Auto: update | When ingredient was last updated |
| deletedAt | DateTime | Optional | Soft deletion timestamp |

##### RecipeIngredient Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for recipe-ingredient relation |
| recipeId | UUID | Foreign Key, Required | References Recipe |
| ingredientId | UUID | Foreign Key, Required | References Ingredient |
| quantity | Float | Required | Amount of ingredient |
| unit | String | Required | Unit of measurement (e.g., "grams", "cups") |

##### MeasurementUnit Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for measurement unit |
| name | String | Unique, Required | Full name of unit (e.g., "Gram") |
| abbreviation | String | Unique, Required | Short form of unit (e.g., "g") |
| system | String | Required | "metric" or "imperial" |
| type | String | Required | "volume", "weight", "count", etc. |
| baseConversion | Float | Optional | Conversion factor to base unit of its type |
| createdAt | DateTime | Auto: current time | When unit was created |
| updatedAt | DateTime | Auto: update | When unit was last updated |

##### SchemaVersion Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | Integer | Primary Key, Default: 1 | Identifier for schema version record |
| version | String | Required | Schema version string |
| lastUpdated | DateTime | Auto: current time | When schema was last updated |
| migrationNotes | Text | Optional | Notes about migration process |

#### Phase 1 Entity Relationships

| Entity | Relationship | Related Entity | Description |
|--------|--------------|----------------|-------------|
| Recipe | One-to-Many | RecipeIngredient | Ingredients used in recipe |
| Ingredient | One-to-Many | RecipeIngredient | Recipes using this ingredient |
| RecipeIngredient | Many-to-One | Recipe | Parent recipe |
| RecipeIngredient | Many-to-One | Ingredient | Referenced ingredient |

#### Phase 1 Schema Design Principles

1. **UUID Primary Keys**
   - Using UUID strings instead of autoincrement integers to prevent synchronization conflicts
   - Allows for distributed recipe creation across devices without ID collisions
   - Maintains a stable reference even when syncing or migrating data
   
   **Implementation:**
   ```prisma
   model Recipe {
     id        String   @id @default(uuid()) @db.Uuid
     name      String   @unique
     // other fields
   }
   ```
   
   **Rationale:** UUID primary keys were selected over auto-incrementing integers for several compelling reasons:
   - They prevent synchronization conflicts in distributed environments
   - They enable offline-first functionality, allowing recipe creation across devices without ID collisions
   - They enhance security by making IDs non-sequential and harder to guess
   - They maintain stable references when syncing or migrating data between environments

2. **Normalized Ingredient Names**
   
   **Implementation:**
   ```prisma
   model Ingredient {
     id             String    @id @default(uuid()) @db.Uuid
     name           String    @unique
     normalizedName String    @unique
     // other fields
   }
   ```
   
   **Rationale:** This dual-field approach represents a strategic trade-off between storage and computational efficiency:
   - The `name` field maintains proper formatting for display purposes
   - The `normalizedName` field optimizes search performance by enabling exact matches without complex string operations
   - The minimal additional storage cost is justified by significant query performance benefits
   - This approach eliminates issues with capitalization and spacing variations during searches
   - It provides a foundation for implementing more sophisticated search algorithms in future phases

3. **Cascade Delete Configuration**
   
   **Implementation:**
   ```prisma
   model RecipeIngredient {
     // other fields
     recipe       Recipe     @relation("RecipeToIngredients", fields: [recipeId], references: [id], onDelete: Cascade)
     ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
   }
   ```
   
   **Rationale:** The cascade delete strategy was carefully designed to maintain data integrity:
   - Child records (RecipeIngredient, RecipeSection, Instruction) use `onDelete: Cascade` to prevent orphaned records
   - Reference entities (Ingredient, Tag, Equipment) use the default `onDelete: Restrict` to prevent accidental deletion of entities referenced by recipes
   - This approach balances the need for data integrity with protection of valuable shared reference data
   - The design supports the soft delete functionality specified in the technical requirements

4. **Soft Delete Functionality**
   - Added `deletedAt` DateTime field that's nullable to relevant models
   - Records with a non-null `deletedAt` will be filtered out in normal queries
   - After 30 days, a scheduled job will permanently remove these records

5. **Previous Version Support**
   - Added `previousVersion` JSON field to store the last version of the recipe
   - Enables quick reversion without requiring a complex versioning system
   - Preserves history while maintaining a simple schema

6. **Schema Version Tracking**
   - Added SchemaVersion model to track database schema changes
   - Facilitates migration between versions
   - Provides context for troubleshooting

### 2.2 Phase 2: Core Functionality (Frontend Development)

Phase 2 expands on the foundation by adding support for structured instructions, image management, recipe sections, equipment, and recipe linking.

#### Additional Entities

##### RecipeSection Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for section |
| recipeId | UUID | Foreign Key, Required | References Recipe |
| name | String | Required | Section name (e.g., "Sauce", "Main") |
| orderIndex | Integer | Required | Position within recipe |

##### Instruction Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for instruction |
| sectionId | UUID | Foreign Key, Required | References RecipeSection |
| stepNumber | Integer | Required | Order within section |
| text | Text | Required | Instruction text |
| stepType | String | Default: "Cooking" | Type of instruction step |
| timerLength | Integer | Optional | Timer duration in seconds |

##### Image Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for image |
| recipeId | UUID | Foreign Key, Required | References Recipe |
| filePath | String | Required | Path to image file |
| isPrimary | Boolean | Default: false | Whether this is the main image |
| width | Integer | Optional | Image width in pixels |
| height | Integer | Optional | Image height in pixels |
| fileSize | Integer | Optional | File size in bytes |
| uploadedAt | DateTime | Auto: current time | When image was uploaded |

##### Tag Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for tag |
| name | String | Unique, Required | Tag name |
| color | String | Optional | HEX color code for visual representation |

##### Equipment Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for equipment |
| name | String | Unique, Required | Equipment name |
| description | Text | Optional | Equipment description |
| createdAt | DateTime | Auto: current time | When equipment was created |
| updatedAt | DateTime | Auto: update | When equipment was last updated |

##### RecipeEquipment Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for recipe-equipment relation |
| recipeId | UUID | Foreign Key, Required | References Recipe |
| equipmentId | UUID | Foreign Key, Required | References Equipment |
| optional | Boolean | Default: false | Whether equipment is optional |
| quantity | Integer | Default: 1 | Number of equipment items needed |

##### RecipeLink Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for recipe link |
| sourceRecipeId | UUID | Foreign Key, Required | References source Recipe |
| linkedRecipeId | UUID | Foreign Key, Required | References linked Recipe |
| linkType | String | Required | Relationship type (e.g., "sauce", "side") |
| notes | Text | Optional | Notes about the recipe link |

##### NutritionalInfo Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for nutritional info |
| calories | Float | Optional | Calories per serving |
| protein | Float | Optional | Protein content in grams |
| carbs | Float | Optional | Carbohydrate content in grams |
| fat | Float | Optional | Fat content in grams |
| fiber | Float | Optional | Fiber content in grams |
| sugar | Float | Optional | Sugar content in grams |
| sodium | Float | Optional | Sodium content in milligrams |
| source | String | Default: "calculated" | Source of nutritional info |
| lastUpdated | DateTime | Auto: current time | When info was last updated |

#### Phase 2 Entity Relationships

| Entity | Relationship | Related Entity | Description |
|--------|--------------|----------------|-------------|
| Recipe | One-to-Many | RecipeSection | Sections within recipe |
| Recipe | One-to-Many | Image | Images of recipe |
| Recipe | Many-to-Many | Tag | Tags applied to recipe |
| Recipe | One-to-Many | RecipeEquipment | Equipment used in recipe |
| Recipe | One-to-Many | RecipeLink (as sourceRecipe) | Links to other recipes |
| Recipe | One-to-Many | RecipeLink (as linkedRecipe) | Links from other recipes |
| Recipe | One-to-One | NutritionalInfo | Nutritional information for recipe |
| RecipeSection | One-to-Many | Instruction | Instructions within section |
| Tag | Many-to-Many | Recipe | Recipes with this tag |
| Equipment | One-to-Many | RecipeEquipment | Recipes using this equipment |

#### Phase 2 Schema Enhancements

1. **Structured Instructions**
   - Replace simple text instructions with hierarchical sections and steps
   - Support timing information and instruction types
   - Allow more complex recipe organization

2. **Image Management**
   - Store image metadata in the database
   - Support multiple images per recipe with primary image designation
   - Track image dimensions and file size for optimization

3. **Tagging System**
   - Implement flexible categorization through tags
   - Support colored tags for visual organization
   - Allow filtering and searching by tags

4. **Strategic Indexing**
   - Add indexes for commonly queried fields
   - Balance query performance against index maintenance cost
   - Support efficient filtering operations

### 2.3 Phase 3: Enhanced Features (Functionality Expansion)

Phase 3 adds support for advanced features including meal planning, shopping lists, recipe variations, and efficient nutritional information management.

#### Advanced Functionality Entities

##### MealPlan Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for meal plan |
| name | String | Required | Meal plan name |
| startDate | DateTime | Required | Start date of meal plan |
| endDate | DateTime | Required | End date of meal plan |
| createdAt | DateTime | Auto: current time | When meal plan was created |
| updatedAt | DateTime | Auto: update | When meal plan was last updated |

##### MealPlanEntry Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for meal plan entry |
| mealPlanId | UUID | Foreign Key, Required | References MealPlan |
| recipeId | UUID | Foreign Key, Required | References Recipe |
| date | DateTime | Required | Date of planned meal |
| mealType | String | Required | Meal type (breakfast, lunch, dinner, snack) |
| servings | Integer | Default: 1 | Number of servings |
| notes | Text | Optional | Notes about the meal |

##### ShoppingList Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for shopping list |
| name | String | Required | Shopping list name |
| isActive | Boolean | Default: true | Whether list is active |
| notes | Text | Optional | Notes about the shopping list |
| createdAt | DateTime | Auto: current time | When list was created |
| updatedAt | DateTime | Auto: update | When list was last updated |

##### ShoppingListItem Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for shopping list item |
| shoppingListId | UUID | Foreign Key, Required | References ShoppingList |
| ingredientId | UUID | Foreign Key, Optional | References Ingredient |
| customItem | String | Optional | Custom item not in ingredient database |
| quantity | Float | Optional | Amount needed |
| unit | String | Optional | Unit of measurement |
| isChecked | Boolean | Default: false | Whether item has been checked off |
| notes | Text | Optional | Notes about the item |

##### RecipeVariation Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for recipe variation |
| recipeId | UUID | Foreign Key, Required | References parent Recipe |
| name | String | Required | Variation name |
| description | Text | Optional | Variation description |
| changes | JSON | Required | Differences from the main recipe |
| createdAt | DateTime | Auto: current time | When variation was created |
| isDefault | Boolean | Default: false | Whether this is the default variation |

##### Enhanced NutritionalInfo Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for nutritional info |
| calories | Float | Optional | Calories per serving |
| protein | Float | Optional | Protein content in grams |
| carbs | Float | Optional | Carbohydrate content in grams |
| fat | Float | Optional | Fat content in grams |
| fiber | Float | Optional | Fiber content in grams |
| sugar | Float | Optional | Sugar content in grams |
| sodium | Float | Optional | Sodium content in milligrams |
| cholesterol | Float | Optional | Cholesterol content in milligrams |
| perServing | Boolean | Default: true | If false, values are per 100g/ml |
| source | String | Default: "calculated" | Source of nutritional data |
| lastUpdated | DateTime | Auto: current time | When data was last updated |
| refreshRequested | Boolean | Default: false | Flag for user-requested refresh |
| lastApiSyncAt | DateTime | Optional | When last synced with external API |
| cacheExpiresAt | DateTime | Optional | When to consider refreshing |
| externalData | JSON | Optional | Stores complete external API response |

#### Phase 3 Entity Relationships

| Entity | Relationship | Related Entity | Description |
|--------|--------------|----------------|-------------|
| Recipe | One-to-Many | RecipeVariation | Variations of this recipe |
| Recipe | One-to-Many | MealPlanEntry | Meal plan entries using this recipe |
| MealPlan | One-to-Many | MealPlanEntry | Entries in this meal plan |
| ShoppingList | One-to-Many | ShoppingListItem | Items in this shopping list |
| Ingredient | One-to-Many | ShoppingListItem | Shopping list items referencing this ingredient |

#### Nutritional Information Management Approach

1. **Data Persistence Strategy**
   - Store complete nutritional data once retrieved
   - Track the source of nutritional data (calculated vs. external API)
   - Implement a conservative refresh strategy
   - Include user-triggered refresh capability

2. **External API Integration Design**
   - Track API usage with dedicated metrics
   - Implement request batching and prioritization
   - Cache API responses for long periods (nutrition data is stable)
   - Provide local calculation fallback for API unavailability

### 2.4 Phase 4: Optimization & Polish (System Refinement)

Phase 4 focuses on optimization through strategic indexing, performance monitoring, and system health tracking.

#### Performance Monitoring Entities

##### QueryPerformance Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for performance record |
| queryType | String | Required | Type of query ("get", "list", "search") |
| entityType | String | Required | Type of entity being queried |
| executionTime | Integer | Required | Time in milliseconds |
| resultCount | Integer | Optional | Number of results returned |
| parameters | JSON | Optional | Query parameters used |
| timestamp | DateTime | Auto: current time | When query was executed |

##### SystemHealth Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for health record |
| timestamp | DateTime | Auto: current time | When record was created |
| databaseSizeBytes | Integer | Required | Size of database in bytes |
| imageTotalBytes | Integer | Required | Total size of all images |
| activeConnections | Integer | Required | Number of active connections |
| cpuUsagePercent | Float | Required | CPU usage percentage |
| memoryUsagePercent | Float | Required | Memory usage percentage |
| diskUsagePercent | Float | Required | Disk usage percentage |

##### BackupRecord Entity

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier for backup record |
| timestamp | DateTime | Auto: current time | When backup was created |
| filePath | String | Required | Path to backup file |
| sizeBytes | Integer | Required | Size of backup in bytes |
| isAutomatic | Boolean | Default: true | Whether backup was automatic |
| isSuccessful | Boolean | Required | Whether backup succeeded |
| errorMessage | Text | Optional | Error message if backup failed |
| restoredAt | DateTime | Optional | When backup was restored |

#### Phase 4 Database Optimizations

1. **Advanced Indexing Strategy**
   - Implement composite indexes for common query patterns
   - Add sorted indexes for range queries
   - Optimize for both read and write performance
   
   **Implementation:**
   ```prisma
   model Recipe {
     // fields
     @@index([deletedAt])
     @@index([updatedAt])
   }
   ```
   
   **Rationale:** The indexing strategy balances query performance against maintenance costs:
   - It focuses on fields commonly used in filtering operations (deletedAt, updatedAt)
   - It avoids over-indexing, which would impact write performance
   - It complements the native indexing of primary and unique fields
   - It supports the specified query patterns in the technical requirements
   - It provides performance benefits for the most common access patterns

2. **Performance Monitoring Infrastructure**
   - Track query execution times and patterns
   - Monitor system resource usage
   - Identify performance bottlenecks

3. **Automated Maintenance Processes**
   - Implement database optimization routines
   - Schedule automated backups with retention policy
   - Clean up orphaned records and unused assets

## 3. API Architecture

The API follows RESTful principles and is implemented using Express.js. The API will be developed in line with the four-phase approach.

### 3.1 API Design Principles

1. **Consistency**
   - Use consistent URL patterns, HTTP methods, and response formats
   - Follow RESTful naming conventions
   - Standardize error handling and response codes

2. **Versioning**
   - Implement API versioning to support backward compatibility
   - Include version number in URL path (e.g., `/api/v1/recipes`)
   - Maintain documentation for all API versions

3. **Security**
   - Implement authentication and authorization for all endpoints
   - Validate all input data
   - Protect against common vulnerabilities (CSRF, XSS, injection)

4. **Performance**
   - Support pagination for list endpoints
   - Implement filtering and sorting options
   - Use appropriate caching headers
   - Support partial responses for large resources

5. **REST API Structure**
   
   **Implementation:**
   ```
   GET /api/recipes/search/byName?q=pasta
   GET /api/recipes/search/byIngredient?q=brownonion
   GET /api/recipes/search/byTag?q=italian
   ```
   
   **Rationale:** The API structure follows RESTful principles for several key reasons:
   - It provides a consistent, intuitive interface that aligns with modern web development practices
   - The resource-oriented design clearly separates concerns and promotes maintainable code
   - Specialized search endpoints optimize query performance for different search patterns
   - The approach supports the progressive enhancement strategy outlined in the technical specification
   - It facilitates clear separation between client and server components, enabling independent evolution

6. **ORM-Based Query Implementation**
   
   **Implementation:**
   ```javascript
   const recipes = await prisma.recipe.findMany({
     where: {
       recipeIngredients: {
         some: {
           ingredient: {
             normalizedName: "brownonion"
           }
         }
       }
     },
     include: {
       recipeIngredients: {
         include: {
           ingredient: true
         }
       }
     }
   });
   ```
   
   **Rationale:** Prisma's ORM approach offers substantial benefits over raw SQL:
   - It provides type safety through generated TypeScript types, reducing runtime errors
   - The query builder prevents SQL injection vulnerabilities by properly parameterizing queries
   - Relationship traversal is handled efficiently, reducing the need for complex manual joins
   - The consistent query structure works across different database providers, supporting future migration if needed
   - The approach maintains performance through Prisma's query optimization capabilities

### 3.2 Core API Endpoints

#### Phase 1: Foundation

| Resource | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Recipes | GET | `/api/recipes` | List all recipes with pagination |
| Recipes | GET | `/api/recipes/:id` | Get a specific recipe |
| Recipes | POST | `/api/recipes` | Create a new recipe |
| Recipes | PUT | `/api/recipes/:id` | Update a recipe |
| Recipes | DELETE | `/api/recipes/:id` | Soft delete a recipe |
| Ingredients | GET | `/api/ingredients` | List all ingredients |
| Ingredients | POST | `/api/ingredients` | Create a new ingredient |
| Ingredients | PUT | `/api/ingredients/:id` | Update an ingredient |
| Search | GET | `/api/recipes/search?q=:query` | Search recipes by name |
| System | GET | `/api/system/health` | Get system health |

#### Phase 2: Core Functionality

| Resource | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Images | POST | `/api/recipes/:id/images` | Upload an image for a recipe |
| Images | GET | `/api/recipes/:id/images` | Get all images for a recipe |
| Images | PUT | `/api/images/:id/primary` | Set image as primary |
| Tags | GET | `/api/tags` | List all tags |
| Tags | POST | `/api/tags` | Create a new tag |
| Instructions | GET | `/api/recipes/:id/sections` | Get all sections with instructions |
| Instructions | POST | `/api/recipes/:id/sections` | Add a section to a recipe |
| Equipment | GET | `/api/equipment` | List all equipment |
| Recipe Links | POST | `/api/recipes/:id/links` | Create link between recipes |

#### Phase 3: Enhanced Features

| Resource | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Meal Plans | GET | `/api/mealplans` | List all meal plans |
| Meal Plans | POST | `/api/mealplans` | Create a new meal plan |
| Shopping Lists | GET | `/api/shoppinglists` | List all shopping lists |
| Shopping Lists | POST | `/api/mealplans/:id/generatelist` | Generate shopping list from meal plan |
| Nutrition | GET | `/api/recipes/:id/nutrition` | Get nutritional info for a recipe |
| Nutrition | POST | `/api/recipes/:id/nutrition/refresh` | Trigger nutrition refresh for recipe |
| Recipe Variations | GET | `/api/recipes/:id/variations` | Get all variations for a recipe |

#### Phase 4: Optimization & Polish

| Resource | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| System | GET | `/api/system/performance` | Get system performance metrics |
| System | GET | `/api/system/storage` | Get storage usage |
| Backups | GET | `/api/backups` | List all backups |
| Backups | POST | `/api/backups/:id/restore` | Restore from backup |
| Maintenance | POST | `/api/maintenance/optimize` | Optimize database |

### 3.3 Nutritional Data Management Endpoints

The system will implement a conservative approach to external API usage for nutritional data, recognizing that this information is relatively stable.

| Endpoint | Purpose | Refresh Strategy |
|----------|---------|------------------|
| `/api/recipes/:id/nutrition` | Get current nutritional data | Returns cached data unless expired |
| `/api/recipes/:id/nutrition/refresh` | Force refresh of nutritional data | Manually triggers external API refresh |
| `/api/ingredients/:id/nutrition` | Get ingredient nutritional data | Returns cached data with very long expiration |
| `/api/system/nutrition/status` | Get nutritional data freshness metrics | Shows age of cached data across system |

1. **Data Refresh Principles**
   - Nutritional data considered stable and refreshed only when:
     * Recipe ingredients or quantities change
     * Cache expiration threshold reached (default: 90+ days)
     * User explicitly requests refresh
     * System detects potential data inaccuracy

2. **API Conservation Strategy**
   - Implement batched processing for nutritional updates
   - Prioritize updates for frequently accessed recipes
   - Schedule updates during off-peak usage periods
   - Cap daily API calls to prevent quota exhaustion

## 4. External API Integration

### 4.1 Nutritional Information API Integration

The application will integrate with external nutrition data APIs (such as Spoonacular) using a conservative approach that prioritizes data persistence and minimizes API calls.

#### 4.1.1 Integration Principles

1. **Data Persistence Strategy**
   - Store complete API responses once retrieved
   - Consider nutritional data as relatively stable long-term
   - Implement tiered caching based on data type:
     * Basic nutritional values: Very long-term caching (180+ days)
     * Detailed nutritional breakdown: Long-term caching (90+ days)
     * Processing suggestions: Medium-term caching (30+ days)

2. **Refresh Triggers**
   - Recipe modification: Refresh when ingredients or quantities change
   - Time-based: Refresh data older than configured threshold
   - User-requested: Allow manual refresh through UI
   - Bulk update: Administrative function to update in batches

3. **API Conservation**
   - Implement rate limiting and quota management
   - Batch similar requests to minimize API calls
   - Schedule non-urgent updates during off-peak periods
   - Track and report API usage metrics

#### 4.1.2 API Processing Workflow

1. **Request Handling**
   - Check local cache for existing data
   - Verify data freshness against configurable thresholds
   - Return cached data unless refresh conditions met

2. **Refresh Processing**
   - Queue refresh requests based on priority
   - Implement exponential backoff for failed requests
   - Store complete API responses for future reference
   - Extract and normalize relevant data

3. **Fallback Mechanism**
   - Implement local calculation for basic nutritional values
   - Clearly indicate data source to users (API vs. calculated)
   - Gracefully degrade features when API unavailable

## 5. Testing Strategy

The project follows a test-driven development approach with comprehensive testing at multiple levels.

### 5.1 Unit Testing

Unit tests focus on isolated components and functions:

1. **Testing Scope**
   - Database operations through Prisma
   - Data validation and transformation utilities
   - Business logic services
   - API request handlers

2. **Testing Approach**
   - Use Jest as the testing framework
   - Implement mock database for isolation
   - Test both success and failure cases
   - Maintain minimum 80% code coverage

### 5.2 Integration Testing

Integration tests verify the interaction between components:

1. **Testing Scope**
   - API endpoint functionality
   - Database interactions
   - External API integrations
   - Authentication flows

2. **Testing Approach**
   - Use Supertest with Express for API testing
   - Implement test database with seed data
   - Test complete request-response cycles
   - Verify proper error handling

### 5.3 End-to-End Testing

End-to-End tests verify the complete application flow:

1. **Testing Scope**
   - User workflows (creating and managing recipes)
   - Cross-component interactions
   - UI functionality with API communication

2. **Testing Approach**
   - Use Cypress for browser-based testing
   - Implement realistic test scenarios
   - Test across different devices and screen sizes
   - Verify offline functionality

### 5.4 Performance Testing

Performance tests are added in later phases to verify system efficiency:

1. **Testing Scope**
   - API response times under various loads
   - Database query performance
   - Image processing efficiency
   - Application startup time

2. **Testing Approach**
   - Use k6 or Artillery for load testing
   - Establish performance baselines
   - Monitor resource utilization
   - Test with realistic data volumes

### 5.5 Database Seeding Approach

**Implementation:**
```javascript
// prisma/seed.js
async function main() {
  // Create measurement units, ingredients, recipes with relationships
  // ...
}
```

**Rationale:** A dedicated seed file offers several significant advantages:
- It ensures consistent test data across all development environments, making test results reliable and reproducible
- It enables testing of complex relationships and edge cases that would be difficult to create manually
- It serves as living documentation of the data model and expected relationships
- It supports CI/CD processes by providing a known data state for automated testing
- It facilitates local development by quickly populating the database with realistic test scenarios

### 5.6 Testing Framework Integration

**Implementation:**
```json
{
  "scripts": {
    "seed": "node prisma/seed.js",
    "test": "jest",
    "test:e2e": "npm run seed && cypress run"
  }
}
```

**Rationale:** This integration creates a streamlined development workflow:
- It ensures tests run against a known data state, improving reliability
- It eliminates the need for complex test setup and teardown procedures
- It supports both local development testing and automated CI/CD testing
- It provides a consistent approach across different types of tests (unit, integration, e2e)
- It keeps the testing environment aligned with the production data model

## 6. Deployment Architecture

### 6.1 Infrastructure Overview

The application is deployed as containerized services on a Raspberry Pi home server with the following architecture:

1. **Core Components**
   - Node.js API server containerized with Docker
   - SQLite database for data persistence
   - Nginx reverse proxy for routing and SSL termination
   - WireGuard VPN for secure remote access

2. **Storage Architecture**
   - Database files stored on mounted volume
   - Recipe images stored in organized directory structure
   - Automated backups to separate storage location
   - Version control for database schema changes

3. **Network Architecture**
   - Internal service network for container communication
   - WireGuard VPN for secure external access
   - HTTPS for all client-server communication
   - Rate limiting for API endpoints

4. **Remote Access Strategy**
   
   **Implementation:**
   - WireGuard server on Raspberry Pi
   - Client configurations for phone and development machine
   - Single port forwarding (UDP 51820) on home router
   
   **Rationale:** WireGuard was selected as the optimal remote access solution for several compelling reasons:
   - It provides strong encryption and authentication using modern cryptographic principles
   - It requires minimal network exposure (single UDP port) compared to alternatives
   - It enables secure access to the Recipe App from mobile devices when away from home
   - It avoids the complexity and security concerns of exposing the application directly to the internet
   - It has low overhead, making it suitable for the Raspberry Pi's limited resources
   - It offers better performance and simpler configuration than alternatives like OpenVPN

5. **Network Isolation**
   
   **Implementation:**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default deny outgoing
   sudo ufw allow from 192.168.1.0/24 to any port 22
   sudo ufw allow 51820/udp
   sudo ufw allow from 10.0.0.0/24 to any port 3000
   sudo ufw enable
   ```
   
   **Rationale:** The network isolation strategy follows the principle of least privilege:
   - It restricts VPN clients to accessing only the Recipe App, not the entire home network
   - It minimizes the potential impact of compromised VPN credentials
   - It creates defense-in-depth by implementing restrictions at multiple levels
   - It protects other devices on the home network from potential lateral movement
   - It aligns with cybersecurity best practices while maintaining the required functionality

6. **Client Configuration**
   
   **Implementation:**
   ```
   [Interface]
   PrivateKey = <client_private_key>
   Address = 10.0.0.2/32
   
   [Peer]
   PublicKey = <server_public_key>
   AllowedIPs = 10.0.0.1/32
   Endpoint = <your_public_ip>:51820
   ```
   
   **Rationale:** The restrictive client configuration enhances security in several ways:
   - It limits the client to sending traffic only to the WireGuard server's specific IP
   - It prevents clients from accessing other VPN clients or routing traffic through your network
   - It creates a point-to-point connection rather than full network access
   - It reduces the attack surface by limiting network visibility
   - It adds another layer of protection beyond the server-side firewall rules

### 6.2 Containerization Strategy

The application follows a containerized deployment approach:

1. **Container Organization**
   - API server container with Node.js runtime
   - Nginx container for reverse proxy and static file serving
   - WireGuard container for VPN access
   - Separate volumes for persistent data

2. **Configuration Management**
   - Environment variables for runtime configuration
   - Secrets management for sensitive information
   - Configuration files mounted as volumes
   - Runtime parameter validation

3. **Resource Allocation**
   - Memory limits for containers based on function
   - CPU allocation prioritizing API responsiveness
   - Storage quotas for image and database growth
   - Monitoring for resource utilization

### 6.3 Continuous Integration and Deployment

The project implements a comprehensive CI/CD pipeline:

1. **Build Pipeline**
   - Triggered on code changes to main branch
   - Runs all test suites (unit, integration, end-to-end)
   - Builds Docker images with proper versioning
   - Generates deployment artifacts

2. **Deployment Pipeline**
   - Creates database backup before deployment
   - Transfers deployment artifacts to Raspberry Pi
   - Applies database migrations if needed
   - Performs rolling update of containers
   - Verifies deployment success with health checks

3. **Monitoring and Rollback**
   - Implements health checking for deployed services
   - Monitors performance metrics post-deployment
   - Supports automated rollback on deployment failure
   - Retains previous versions for manual rollback

4. **CI/CD Strategy**
   
   **Implementation:** Use GitHub Actions for automated testing, but handle deployment manually from the local development environment.
   
   **Rationale:** This balanced approach was selected after careful consideration:
   - Automated testing via GitHub Actions provides quality assurance without requiring complex network access to your home environment
   - Manual deployment aligns with the development workflow, as improvements are typically made from your local machine
   - This approach eliminates potential security concerns associated with exposing your home network for CI/CD purposes
   - It significantly reduces implementation complexity compared to automated deployment solutions
   - It maintains the benefits of version control and automated testing while avoiding unnecessary automation

5. **Deployment Script**
   
   **Implementation:**
   ```bash
   #!/bin/bash
   # Script to deploy the Recipe App
   docker stop recipe-app || true
   docker rm recipe-app || true
   docker build -t recipe-app:latest .
   # Create backup and start new container
   # ...
   ```
   
   **Rationale:** The deployment script provides several benefits:
   - It ensures consistency in the deployment process, reducing human error
   - It incorporates database backup procedures to protect against data loss
   - It automates the container management process
   - It serves as documentation for the deployment steps
   - It simplifies the development workflow while maintaining deployment quality

## 7. Migration Strategy

As the schema evolves through the development phases, a clear migration strategy is essential.

### 7.1 Schema Evolution Approach

1. **Migration Planning**
   - Document all schema changes between phases
   - Identify data transformation requirements
   - Establish rollback procedures
   - Test migrations with production-like data

2. **Migration Execution**
   - Create full database backup before migration
   - Generate and apply Prisma migrations
   - Transform existing data to new schema format
   - Validate data integrity post-migration

3. **Rollback Strategy**
   - Maintain ability to revert to previous schema
   - Create rollback scripts for each migration
   - Test rollback procedures before deployment
   - Document manual recovery procedures

### 7.2 Key Migration Examples

#### Phase 1 to Phase 2: Instruction Structure Transformation

The migration from simple text instructions to structured sections and steps requires:

1. Parsing text instructions into logical sections
2. Creating appropriate section records
3. Converting instruction lines to individual step records
4. Preserving the original instruction order
5. Validating the transformation results

#### Phase 2 to Phase 3: Cuisine Type to Tag Migration

Converting the cuisineType field to a tag-based approach requires:

1. Identifying all unique cuisine types in the database
2. Creating corresponding tag records with appropriate colors
3. Associating recipes with the newly created tags
4. Removing the redundant cuisineType field
5. Updating frontend components to use tags for filtering

## 8. Conclusion

This technical specification outlines the detailed implementation plan for the Recipe App across four development phases. By following this structured approach, the project will evolve from a basic recipe management system to a comprehensive cooking companion with advanced features, while maintaining code quality, performance, and security throughout the development lifecycle.

The integration with external APIs for nutritional information follows a conservative approach that recognizes the relative stability of this data, implementing appropriate caching strategies and refresh triggers to minimize unnecessary API calls while maintaining data accuracy.

Each phase builds upon the previous one, with clear migration paths and testing strategies to ensure that the application remains functional and efficient as it grows in complexity.