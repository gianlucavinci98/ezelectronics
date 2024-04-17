# Requirements Document - current EZElectronics

Date:

Version: V1 - description of EZElectronics in CURRENT form (as received by teachers)

| Version number | Change |
| :------------: | :----: |
|                |        |

# Contents

- [Requirements Document - current EZElectronics](#requirements-document---current-ezelectronics)
- [Contents](#contents)
- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
  - [Context Diagram](#context-diagram)
  - [Interfaces](#interfaces)
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
  - [Functional Requirements](#functional-requirements)
  - [Non Functional Requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
  - [Use case diagram](#use-case-diagram)
    - [Use case 1, UC1](#use-case-1-uc1)
        - [Scenario 1.1](#scenario-11)
        - [Scenario 1.2](#scenario-12)
        - [Scenario 1.x](#scenario-1x)
    - [Use case 2, UC2](#use-case-2-uc2)
    - [Use case x, UCx](#use-case-x-ucx)
- [Glossary](#glossary)
- [System Design](#system-design)
- [Deployment Diagram](#deployment-diagram)

# Informal description

EZElectronics (read EaSy Electronics) is a software application designed to help managers of electronics stores to manage their products and offer them to customers through a dedicated website. Managers can assess the available products, record new ones, and confirm purchases. Customers can see available products, add them to a cart and see the history of their past purchases.

# Stakeholders

| Stakeholder name | Description                                                                        |
| :--------------- | :--------------------------------------------------------------------------------- |
| Manager          | Person that will manage the website and the orders                                 |
| Developer        | Person that will develop the website                                               |
| Supplier         | Person that will supply the goods sold on the website                              |
| Customer         | Person that will buy products from the website                                     |
| Employee         | Person who assists in managing the store, helps customers, and maintains inventory |
| Investor         | Person that will invest money in the development of the website                    |
| Inventory        | Entity that represents the stock of products in the store                          |


# Context Diagram and interfaces

## Context Diagram

\<Define here Context diagram using UML use case diagram>

\<actors are a subset of stakeholders>

## Interfaces

| Actor     | Logical Interface | Physical Interface       |
| :-------- | :---------------- | :----------------------- |
| Manager   | GUI (webapp)      | PC or Tablet             |
| Customer  | GUI (webapp)      | PC, Tablet or Smartphone |
| Inventory | SQLite Database   | File on Filesystem       |

# Stories and personas

**Mario** is a manager of an electronics store. He uses the _EZElectronics_ website to manage the products in his store. He can add new products, remove old ones, and set some product as sold. He can also see the history of the orders made by customers.

**Luigi** is a customer of an electronics store. He uses the _EZElectronics_ website to see the products available in the store. He can add products to his cart, see the history of his past purchases, and confirm an order.

# Functional and non functional requirements

## Functional Requirements

| ID         | Description                                                                                                     |
| :--------- | :-------------------------------------------------------------------------------------------------------------- |
| FR1        | Authorization and Authentication                                                                                |
| FR1.1      | Login                                                                                                           |
| FR1.2      | Logout                                                                                                          |
| FR1.3      | Logged in users shall be able to obtain their information                                                       |
| FR2        | Manage Users                                                                                                    |
| FR2.1      | Unregistered users shall be able to register themselves                                                         |
| **FR2.x**  | List all users / delete all users / retrive users by role / retrive user by username (for testing purposes) (?) |
| FR 3       | Manage Products                                                                                                 |
| FR 3.1     | Managers shall be able to add new products                                                                      |
| FR 3.1.1   | Add a single new product                                                                                        |
| FR 3.1.2   | Add multiple new equal products (product with quantity > 1)                                                     |
| FR 3.2     | Managers shall be able to remove products                                                                       |
| FR 3.3     | Managers shall be able to set a product as sold                                                                 |
| FR 3.4     | Logged in users shall be able to get product information                                                        |
| FR 3.5     | Logged in users shall be able to list products                                                                  |
| FR 3.5.1   | List product of a specific category                                                                             |
| FR 3.5.2   | List product of a specific model                                                                                |
| FR 3.5.3   | List all products                                                                                               |
| FR 3.6     | Managers shall be able to delete a product                                                                      |
| **FR 3.x** | Delete all products (for testing purposes) (?)                                                                  |
| FR 4       | Manage Carts                                                                                                    |
| FR 4.1     | Customers shall be able to list all products in their cart                                                      |
| FR 4.2     | Customers shall be able to add a product to their cart                                                          |
| FR 4.3     | Customers shall be able to remove a product from their cart                                                     |
| FR 4.4     | Customers shall be able to pay the cart                                                                         |
| FR 4.5     | Customers shall be able to list all carts that have been payed                                                  |
| FR 4.6     | Customers shall be able to delete the current cart                                                              |
| **FR 4.x** | Delete all carts (for testing purposes) (?)                                                                     |

## Non Functional Requirements

\<Describe constraints on functional requirements>

| ID      | Type      | Description                                                                                 | Refers to |
| :------ | :-------- | :------------------------------------------------------------------------------------------ | :-------- |
| NFR1    | Usability | Customers shall be able to interact with the webapp with no training in less than 2 minutes | All       |
| NFR2    | Usability | Managers shall be able to interact with the webapp with a training of 1 hour                | All       |
| NFR3    |           |                                                                                             |           |
| NFRx .. |           |                                                                                             |           |

# Use case diagram and use cases

## Use case diagram

\<define here UML Use case diagram UCD summarizing all use cases, and their relationships>

\<next describe here each use case in the UCD>

### Use case 1, UC1

| Actors Involved  |                                                                      |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | \<Boolean expression, must evaluate to true before the UC can start> |
|  Post condition  |  \<Boolean expression, must evaluate to true after UC is finished>   |
| Nominal Scenario |         \<Textual description of actions executed by the UC>         |
|     Variants     |                      \<other normal executions>                      |
|    Exceptions    |                        \<exceptions, errors >                        |

##### Scenario 1.1

\<describe here scenarios instances of UC1>

\<a scenario is a sequence of steps that corresponds to a particular execution of one use case>

\<a scenario is a more formal description of a story>

\<only relevant scenarios should be described>

|  Scenario 1.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | \<Boolean expression, must evaluate to true before the scenario can start> |
| Post condition |  \<Boolean expression, must evaluate to true after scenario is finished>   |
|     Step#      |                                Description                                 |
|       1        |                                                                            |
|       2        |                                                                            |
|      ...       |                                                                            |

##### Scenario 1.2

##### Scenario 1.x

### Use case 2, UC2

..

### Use case x, UCx

..

# Glossary

\<use UML class diagram to define important terms, or concepts in the domain of the application, and their relationships>

\<concepts must be used consistently all over the document, ex in use cases, requirements etc>

# System Design

\<describe here system design>

\<must be consistent with Context diagram>

# Deployment Diagram

\<describe here deployment diagram >
