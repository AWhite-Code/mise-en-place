# Recipe App Design Document

## Overview

The Recipe App is a personal recipe management system designed to store, organize, and access cooking recipes across multiple devices. This application addresses the common challenge of recipe fragmentation by providing a centralized, self-hosted solution that emphasizes privacy, control, and accessibility. The system will be hosted on a Raspberry Pi with remote access secured through WireGuard VPN, allowing seamless usage from both desktop and mobile devices while maintaining full control over personal data.

## Project Vision

### Core Purpose
To create a comprehensive recipe management system that combines the joy of cooking with modern software development practices, serving as both a practical tool and a learning platform.

### Key Objectives

- Create a personal recipe repository that is accessible from anywhere while maintaining complete data ownership
- Implement a modern, responsive user interface that works well on both desktop and mobile devices
- Establish a robust development environment that follows industry best practices for deployment, testing, and maintenance
- Build a system that can evolve over time with new features while maintaining stability
- Provide a seamless user experience with offline capability for recipe viewing

### Target User

As a personal project, the primary user is the developer. The application design considers the following user stories:

- As a user, I want to store my recipes in a centralized location so I can access them from my kitchen, living room, or while shopping
- As a user, I want to quickly search and filter recipes by ingredients, tags, or preparation time
- As a user, I want to view my recipes even when my internet connection is unavailable
- As a user, I want to easily scale recipe quantities based on serving size
- As a user, I want to add photos to my recipes to remember presentation

## System Architecture

The Recipe App adopts a modern architecture utilizing Node.js, React, and Electron, with data persistence handled by Prisma and SQLite.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────┐     ┌─────────────────────────┐
│         Raspberry Pi Server         │     │       Client Devices    │
│                                     │     │                         │
│  ┌─────────────┐    ┌────────────┐  │     │  ┌──────────────────┐  │
│  │             │    │            │  │     │  │                  │  │
│  │  Node.js    │    │  SQLite    │  │     │  │  Electron App    │  │
│  │  Express    │◄───┤  Database  │  │     │  │  (Desktop)       │  │
│  │  API Server │    │            │  │     │  │                  │  │
│  │             │    └────────────┘  │     │  └──────────────────┘  │
│  └──────┬──────┘         ▲          │     │                         │
│         │                │          │     │  ┌──────────────────┐  │
│         │                │          │     │  │                  │  │
│  ┌──────▼──────┐  ┌──────┴───────┐  │     │  │  Progressive     │  │
│  │             │  │              │  │     │  │  Web App         │  │
│  │  Prisma ORM │  │ Image Store  │  │     │  │  (Mobile)        │  │
│  │             │  │              │  │     │  │                  │  │
│  └─────────────┘  └──────────────┘  │     │  └──────────────────┘  │
│                                     │     │                         │
└──────────────────┬──────────────────┘     └────────────┬────────────┘
                   │                                     │
                   │        WireGuard VPN Tunnel        │
                   └─────────────────────────────────────┘
```

*Note: This ASCII diagram provides a conceptual representation of the system architecture. During implementation, professional UML component diagrams will be created that follow industry standards, providing greater detail on component boundaries, interfaces, and dependencies.*

### Component Details

#### Backend Components

1. **Node.js Express Server**: Provides the RESTful API endpoints for all application functionality
   - Handles authentication and authorization
   - Processes all data operations (CRUD)
   - Manages image uploads and processing
   - Exposes search and filtering capabilities

2. **Prisma ORM**: Manages database operations with type safety and migration support
   - Provides type-safe database access
   - Handles schema migrations
   - Enforces data validation and relationships

3. **SQLite Database**: Stores all recipe data in a lightweight, file-based database
   - Recipe information
   - Ingredient definitions
   - Tags and categories
   - Instruction steps
   - Image metadata

4. **Image Storage System**: Manages recipe images with efficient storage
   - Image compression and optimization
   - Thumbnail generation
   - Serves images to clients

5. **WireGuard VPN**: Secures remote access to the system
   - Enables secure connections from external networks
   - Provides encrypted data transmission
   - Simplifies network configuration

#### Frontend Components

1. **React Application**: Core user interface built with React
   - Responsive design for all screen sizes
   - Component-based architecture
   - State management with React Query

2. **Electron Wrapper**: Packages the React application for desktop use
   - Native desktop experience
   - Offline capability
   - System integration (notifications, etc.)

3. **Progressive Web App**: Mobile-optimized version of the interface
   - Installable on mobile devices
   - Offline recipe viewing
   - Responsive controls for touch interfaces

## Integrated Development Approach

The project follows a four-phase development approach that systematically builds functionality while maintaining a focus on quality and testability.

### Phase 1: Foundation (Backend Focus)

This initial phase establishes the core infrastructure, database schema, and development practices.

**Key Deliverables:**

- **Database Implementation:**
  - Core schema with Recipe, Ingredient, RecipeIngredient, and MeasurementUnit models
  - UUID-based primary key strategy
  - Soft delete infrastructure (fields and basic filtering)
  - Version tracking mechanism

- **API Development:**
  - RESTful endpoints for CRUD operations on core entities
  - Basic search and filtering functionality
  - Request validation and error handling
  - Authentication system

- **Infrastructure Setup:**
  - Docker containerization of backend services
  - CI/CD pipeline with GitHub Actions
  - Raspberry Pi deployment configuration
  - WireGuard VPN setup for secure remote access
  - Backup strategy implementation

- **Testing Framework:**
  - Unit tests for database operations
  - Integration tests for API endpoints
  - Test coverage reporting
  - Test data generation utilities

**Technical Focus:**
- Establishing proper development environment
- Implementing test-driven development practices
- Setting up containerization and deployment standards
- Creating a robust and secure foundation for subsequent phases

### Phase 2: Core Functionality (Frontend Development)

This phase introduces the user interface and expands the backend capabilities to support richer recipe management.

**Key Deliverables:**

- **Expanded Database Schema:**
  - Structured instructions and recipe sections
  - Image metadata storage
  - Equipment and tag management
  - Recipe linking capabilities

- **Enhanced API Development:**
  - Image upload and processing endpoints
  - Advanced search and filtering options
  - Tag and category management
  - Instruction sequencing

- **Frontend Implementation:**
  - React application with core components
  - Recipe viewing and editing interfaces
  - Image management
  - Responsive design for all screen sizes
  - Electron packaging for desktop use
  - Progressive Web App implementation

- **Integration:**
  - Frontend-backend communication
  - Offline data synchronization
  - Error handling patterns
  - User feedback mechanisms

**Technical Focus:**
- Creating an intuitive user interface
- Implementing responsive design practices
- Setting up efficient data communication
- Ensuring offline functionality

### Phase 3: Enhanced Features (Functionality Expansion)

This phase adds advanced features that transform the application from a basic recipe manager to a comprehensive cooking companion, with particular focus on efficient Spoonacular API integration.

**Key Deliverables:**

- **Complete Database Schema:**
  - Meal planning and calendar models
  - Shopping list management
  - Enhanced nutritional information tracking
  - Recipe variations
  - User preferences
  - Spoonacular API cache and quota management

- **Advanced API Functionality:**
  - Meal planning endpoints
  - Shopping list generation
  - Recipe scaling calculations
  - External recipe import capabilities
  - Nutritional information integration
  - Ingredient substitution recommendations

- **Feature Development:**
  - Recipe scaling interface
  - Cooking timer implementation
  - Meal planning calendar
  - Shopping list generator
  - Recipe import tools
  - Comprehensive nutritional information display
  - Wine pairing recommendations
  - Ingredient substitution suggestions

- **Spoonacular API Integration:**
  - Recipe information lookup for imported recipes
  - Long-term caching strategy for all API-sourced data
  - Enhanced soft deletion functionality with restoration workflows
  - Implementation of the RecipeLink system for related recipes
  - Required attribution backlinks
  - Advanced strategies for handling API limitations
  - Cuisine type to tag migration

**Recipe Relationships**

The system implements a directional recipe relationship model through the RecipeLink entity:

- **sourceRecipeId**: The "container" recipe where the link originates (e.g., a paella recipe)
- **linkedRecipeId**: The "target" recipe being referenced (e.g., a chicken stock recipe)
- **linkType**: The relationship between recipes (e.g., "component", "sauce", "side dish", "variation")

This enables sophisticated recipe connections such as:
- Component relationships (main dishes linking to sauce or stock recipes)
- Suggested pairings (entrees linking to recommended side dishes)
- Meal collections (holiday menus linking to multiple recipes)
- Recipe variations (traditional versions linking to dietary alternatives)

**Technical Focus:**
- Implementing complex data processing
- Integrating with external systems within strict API limits
- Optimizing and prioritizing API usage
- Building resilient systems with graceful fallbacks
- Enhancing user experience with advanced features

### Phase 4: Optimization & Polish (System Refinement)

The final phase focuses on refining the application performance, enhancing security, ensuring long-term maintainability, and maximizing value from external API integrations.

**Key Deliverables:**

- **Performance Optimization:**
  - Database query optimization with strategic indexing
  - Comprehensive multi-level caching implementation
  - Image loading and processing refinements
  - API response time improvements
  - Spoonacular API call efficiency analysis and optimization

- **API Usage Intelligence:**
  - Analysis of API usage patterns to optimize call frequency
  - Predictive caching based on user behavior
  - Advanced quota management with feature prioritization
  - Complete offline functionality for all API-dependent features
  - Machine learning-based local estimation for nutritional data

- **Security & Reliability:**
  - Comprehensive security audit
  - Automated backup system with rotation
  - System health monitoring with API quota alerting
  - Advanced error handling and recovery
  - Data integrity validation
  - Resilience testing for API unavailability scenarios

- **User Experience Refinement:**
  - UI/UX improvements based on usage patterns
  - Accessibility enhancements
  - Mobile experience optimization
  - Offline capability improvements
  - Transparent communication about API-dependent feature availability

- **Documentation & Maintenance:**
  - Complete API documentation
  - User guides and tutorials
  - System architecture documentation
  - Deployment and maintenance instructions
  - API integration guidelines and troubleshooting

**Technical Focus:**
- Systematic performance profiling and optimization
- External API dependency management
- Predictive API usage patterns and resource allocation
- Security best practices implementation
- User experience testing and refinement
- Documentation completeness and clarity

### Database Optimization Recommendations

1. **Indexing Strategy with UUIDs**
   - Primary key UUIDs are already indexed by default for efficient direct lookups
   - Implement secondary indexes on frequently queried fields:
     ```
     @@index([deletedAt]) // For filtering out deleted records
     @@index([normalizedName]) // For ingredient searching
     @@index([updatedAt]) // For synchronization
     ```
   - These secondary indexes improve performance for filtering operations, while the UUID primary keys handle direct lookups
   - Balance indexing benefits against the performance cost of index maintenance during writes

2. **Schema Versioning**
   - Implement a schema version tracking mechanism
   - Store current schema version in the database
   - Create migration scripts for each version change

3. **Performance Monitoring**
   - Add fields for tracking query performance metrics
   - Implement periodic database optimization routines
   - Consider denormalization for frequently accessed data

4. **Backup Strategy**
   - Implement automated backup system respecting soft delete windows
   - Store backups in separate location from main database
   - Implement backup rotation strategy to minimize storage requirements

### Spoonacular API Integration Strategy

For nutritional information calculation, recipe analysis, and ingredient substitution, the application will integrate with the Spoonacular API under the following constraints:

1. **API Usage Constraints**
   - Hard limit of 150 points per day
   - Rate limit of 1 request per second
   - No additional calls permitted once limit is reached
   - Backlink attribution requirement

2. **Long-Term Data Persistence Strategy**
   - Implement an extended caching approach that recognizes nutritional data as fundamentally non-volatile
   - Store complete API responses with long expiration periods:
     * Basic nutritional values: Very long-term caching (180+ days)
     * Detailed nutritional breakdowns: Long-term caching (90+ days)
     * Ingredient substitutes: Very long-term caching (180+ days)
     * Wine pairings: Long-term caching (90+ days)
   - Refresh cached data only when:
     * Recipe ingredients or quantities are modified
     * User explicitly requests data refresh through UI
     * Administrative bulk refresh is triggered (rarely needed)
     * Cache expiration is reached (primarily as a safety mechanism)

3. **API Conservation Implementation**
   - Reserve daily API quota primarily for newly created recipes and user-requested refreshes
   - Implement strict prioritization of API calls based on user interaction
   - Batch and queue non-urgent API calls for off-peak processing
   - Utilize local calculation for preliminary estimates when API is unavailable

4. **Resilience Architecture**
   - Develop comprehensive local calculation algorithms for core nutritional values
   - Implement graceful degradation of enhanced features when API limits are reached
   - Provide clear visual indicators of data source (API-verified vs. locally calculated)
   - Maintain system functionality during API outages with cached data

## Continuous Integration and Deployment

### GitHub Actions Workflow

The project will implement a comprehensive CI/CD pipeline using GitHub Actions with the following components:

1. **Continuous Integration**
   - Triggered on every push and pull request
   - Runs linting checks to enforce code style
   - Executes all unit and integration tests
   - Generates test coverage reports
   - Builds Docker container to verify build process

2. **Continuous Deployment**
   - Triggered on successful merges to main branch
   - Builds production Docker image
   - Transfers image to Raspberry Pi via SSH
   - Executes deployment script on Raspberry Pi
   - Verifies deployment with health checks

### Deployment Process

The deployment to the Raspberry Pi will be fully automated through the following process:

1. GitHub Actions workflow builds and tags Docker image
2. Image is exported and transferred to Raspberry Pi via SSH
3. Deployment script on Raspberry Pi:
   - Loads the new Docker image
   - Performs database backup
   - Applies any pending migrations
   - Gracefully stops the current container
   - Starts the new container
   - Verifies application health

### Quality Assurance

To maintain code quality throughout development, the following practices will be implemented:

1. **Code Quality Standards**
   - ESLint configuration for consistent code style
   - Prettier for automatic code formatting
   - TypeScript for type safety
   - Husky pre-commit hooks to enforce standards

2. **Testing Requirements**
   - Minimum 80% test coverage for core functionality
   - API endpoint tests for all routes
   - Database operation tests for all entities
   - Mocking of external dependencies

3. **Documentation Requirements**
   - JSDoc comments for all functions and classes
   - README documentation for setup and configuration
   - API documentation using Swagger/OpenAPI
   - Database schema documentation

## Success Criteria

The project will be considered successful when the following criteria are met:

1. **Functionality Completeness**
   - All planned features from Phases 1-3 are implemented and working correctly
   - The application can be used to manage a collection of at least 50 recipes
   - Recipe search and filtering works efficiently

2. **Technical Implementation**
   - Test coverage is at least 80% for critical components
   - CI/CD pipeline successfully deploys changes to the Raspberry Pi
   - Docker containers are properly configured and maintainable
   - Database backups function automatically

3. **User Experience**
   - Application is responsive on both desktop and mobile devices
   - Offline functionality works reliably
   - UI is intuitive and requires minimal instruction
   - Recipe management workflow is efficient and streamlined

4. **System Performance**
   - API response times remain under 500ms for typical operations
   - Image loading and processing completes within acceptable timeframes
   - Application startup time is under 3 seconds
   - System resource usage on Raspberry Pi remains within sustainable limits

5. **Learning Objectives**
   - Development practices mirror professional standards
   - Documentation is comprehensive and follows industry conventions
   - The entire system is maintainable and extensible

## Risk Assessment

### Potential Challenges

1. **Raspberry Pi Performance**
   - **Risk**: Limited computational resources may impact application performance
   - **Mitigation**: Optimize database queries, implement efficient image processing, monitor resource usage

2. **Network Reliability**
   - **Risk**: WireGuard VPN connection may be unreliable in certain network conditions
   - **Mitigation**: Implement robust offline capabilities, add connection status indicators, create retry mechanisms

3. **Data Security**
   - **Risk**: Self-hosted solution may have security vulnerabilities
   - **Mitigation**: Follow security best practices, keep dependencies updated, implement proper authentication

4. **Scope Management**
   - **Risk**: Project scope may expand beyond manageable bounds
   - **Mitigation**: Adhere to phased development approach, prioritize features, maintain focus on core functionality

5. **Test Maintenance**
   - **Risk**: Test-driven approach may slow development or create test maintenance burden
   - **Mitigation**: Focus on testing critical paths, use test utilities and factories, regularly refactor tests

## Conclusion

This design document outlines a comprehensive plan for developing a personal recipe management application using modern web technologies and professional development practices. By following the integrated four-phase approach, the project aims to deliver a practical tool while serving as a platform for professional growth in software development. Each phase builds upon the previous one, ensuring that the system evolves in a controlled and tested manner toward the complete vision.