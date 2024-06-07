# Test Report

<The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover>

## Contents

- [Test Report](#test-report)
  - [Contents](#contents)
  - [Dependency graph](#dependency-graph)
  - [Integration approach](#integration-approach)
  - [Tests](#tests)
    - [Unit tests: White Box](#unit-tests-white-box)
      - [DAO modules](#dao-modules)
      - [Controllers](#controllers)
      - [Routes](#routes)
    - [Integration tests: Black Box](#integration-tests-black-box)
  - [Coverage](#coverage)
    - [Coverage of FR](#coverage-of-fr)
    - [Coverage white box](#coverage-white-box)

## Dependency graph

![Dependency graph](./assets/test_report/DependencyGraph.svg)

## Integration approach

Tests are organized in three principal categories and are performed using the Jest testing framework.
The three categories are:

- **Unit tests**: These tests are used to test the smallest units of the application, such as functions, classes, or modules. They are used to ensure that each unit of the software performs as designed. For each module, dependencies are mocked.
  - firstly DAO modules are tested, which depends only on the database. These modules are `UserDAO`, `CartDAO`, `ProductDAO` and `ReviewDAO`
  - the second step is to test the controllers, whose role is to perform the logic of the application. These modules are `UserController`, `CartController`, `ProductController` and `ReviewController`. They depends on the DAO modules.
  - finally, the Routes are tested. These modules are `UserRoutes`, `CartRoutes`, `ProductRoutes` and `ReviewRoutes`. They depends on the controllers, `Authenticator`, and `ErrorHandler`
- **Integration tests**: These tests are used to test the integration between different units of the application. They are used to ensure that the different units of the software work together as expected.
  - the integration tests are performed on the routes, which are the entry points of the application.For each route the output in the database is checked, so that the entire flow (from the API call to the DB) is tested.
- **Acceptance tests**: These tests are used to test the application as a whole. They are used to ensure that the application meets the requirements of the user.
  - the acceptance tests are performed on the API. These test are written by the committee (course managers)

## Tests

### Unit tests: White Box

#### DAO modules

|    Module    | Function                         | Test cases                                     |       Technique used        |
| :----------: | :------------------------------- | :--------------------------------------------- | :-------------------------: |
|  `UserDAO`   | `createUser`                     | USER -> test createUser method                 | Multiple condition coverage |
|  `UserDAO`   | `getUserByUsername`              | USER -> test getUserByUsername method          | Multiple condition coverage |
|  `UserDAO`   | `getUsers`                       | USER -> test getUsers method                   | Multiple condition coverage |
|  `UserDAO`   | `deleteUser`                     | USER -> test deleteUser method                 | Multiple condition coverage |
|  `UserDAO`   | `deleteAll`                      | USER -> test deleteAll method                  | Multiple condition coverage |
|  `UserDAO`   | `updateUser`                     | USER -> test updateUser method                 | Multiple condition coverage |
|  `UserDAO`   | `getIsUserAuthenticated`         | USER -> test getIsUserAuthenticated method     |  Simple condition coverage  |
| `ProductDAO` | `registerProduct`                | PRODUCT -> test registerProduct                | Multiple condition coverage |
| `ProductDAO` | `changeProductQuantity`          | PRODUCT -> test changeProductQuantity          | Multiple condition coverage |
| `ProductDAO` | `getProduct`                     | PRODUCT -> test getProduct                     | Multiple condition coverage |
| `ProductDAO` | `getProducts`                    | PRODUCT -> test getProducts                    | Multiple condition coverage |
| `ProductDAO` | `getProductsByCategory`          | PRODUCT -> test getProductsByCategory          | Multiple condition coverage |
| `ProductDAO` | `getAvailableProductsByCategory` | PRODUCT -> test getAvailableProductsByCategory | Multiple condition coverage |
| `ProductDAO` | `getProductAvailable`            | PRODUCT -> test getProductAvailable            | Multiple condition coverage |
| `ProductDAO` | `getAvailableProducts`           | PRODUCT -> test getAvailableProducts           | Multiple condition coverage |
| `ProductDAO` | `deleteAllProducts`              | PRODUCT -> test deleteAllProducts              | Multiple condition coverage |
| `ProductDAO` | `deleteProduct`                  | PRODUCT -> test deleteProduct                  | Multiple condition coverage |
|  `CartDAO`   | `getCurrentCart`                 | CART -> getCurrentCart                         | Multiple condition coverage |
|  `CartDAO`   | `getProductsByCartId`            | CART -> getProductsByCartId                    | Multiple condition coverage |
|  `CartDAO`   | `incrementProductInCart`         | CART -> incrementProductInCart                 | Multiple condition coverage |
|  `CartDAO`   | `insertProductInCart`            | CART -> insertProductInCart                    | Multiple condition coverage |
|  `CartDAO`   | `createCart`                     | CART -> createCart                             | Multiple condition coverage |
|  `CartDAO`   | `updateCartTotal`                | CART -> updateCartTotal                        | Multiple condition coverage |
|  `CartDAO`   | `checkoutCart`                   | CART -> checkoutCart                           | Multiple condition coverage |
|  `CartDAO`   | `getCustomerCarts`               | CART -> getCustomerCarts                       | Multiple condition coverage |
|  `CartDAO`   | `deleteProductFromCart`          | CART -> deleteProductFromCart                  | Multiple condition coverage |
|  `CartDAO`   | `clearCart`                      | CART -> clearCart                              | Multiple condition coverage |
|  `CartDAO`   | `deleteAllCarts`                 | CART -> deleteAllCarts                         | Multiple condition coverage |
|  `CartDAO`   | `deleteAllCarts`                 | CART -> deleteAllCarts                         | Multiple condition coverage |
| `ReviewDAO`  | `existingReview`                 | REVIEW -> ReviewDAO.existingReview             | Multiple condition coverage |
| `ReviewDAO`  | `getProductReviews`              | REVIEW -> ReviewDAO.getProductReviews          | Multiple condition coverage |
| `ReviewDAO`  | `addReview`                      | REVIEW -> ReviewDAO.addReview                  | Multiple condition coverage |
| `ReviewDAO`  | `deleteReview`                   | REVIEW -> ReviewDAO.deleteReview               | Multiple condition coverage |
| `ReviewDAO`  | `deleteReviewsOfProduct`         | REVIEW -> ReviewDAO.deleteReviewsOfProduct     | Multiple condition coverage |
| `ReviewDAO`  | `deleteAllReviews`               | REVIEW -> ReviewDAO.deleteAllReviews           | Multiple condition coverage |

#### Controllers

|       Module        | Function                         | Test cases                                        |       Technique used        |
| :-----------------: | :------------------------------- | :------------------------------------------------ | :-------------------------: |
|  `UserController`   | `createUser`                     | USER -> test createUser                           |     Statement coverage      |
|  `UserController`   | `getUsers`                       | USER -> test getUsers                             |     Statement coverage      |
|  `UserController`   | `getUsersByRole`                 | USER -> test getUsersByRole                       |     Statement coverage      |
|  `UserController`   | `getUserByUsername`              | USER -> test getUserByUsername                    | Multiple condition coverage |
|  `UserController`   | `deleteUser`                     | USER -> test deleteUser                           | Multiple condition coverage |
|  `UserController`   | `deleteAll`                      | USER -> test deleteAll                            |     Statement coverage      |
|  `UserController`   | `updateUserInfo`                 | USER -> test updateUserInfo                       | Multiple condition coverage |
| `ProductController` | `registerProduct`                | PRODUCT -> test registerProduct                   | Multiple condition coverage |
| `ProductController` | `changeProductQuantity`          | PRODUCT -> test changeProductQuantity             | Multiple condition coverage |
| `ProductController` | `sellProduct`                    | PRODUCT -> test sellProduct                       | Multiple condition coverage |
| `ProductController` | `getProducts`                    | PRODUCT -> test getProducts                       | Multiple condition coverage |
| `ProductController` | `getAvailableProducts`           | PRODUCT -> test getAvailableProducts              | Multiple condition coverage |
| `ProductController` | `deleteAllProducts`              | PRODUCT -> test deleteAllProducts                 |     Statement coverage      |
| `ProductController` | `deleteProduct`                  | PRODUCT -> test deleteProduct                     |     Statement coverage      |
|  `CartController`   | `addToCart`                      | CART -> addToCart                                 | Multiple condition coverage |
|  `CartController`   | `getCart`                        | CART -> getCart                                   |     Statement coverage      |
|  `CartController`   | `checkoutCart`                   | CART -> checkoutCart                              | Multiple condition coverage |
|  `CartController`   | `checkProductAvailabilityOfCart` | CART -> checkProductAvailabilityOfCart            | Multiple condition coverage |
|  `CartController`   | `getCustomerCarts`               | CART -> getCustomerCarts                          |     Statement coverage      |
|  `CartController`   | `removeProductFromCart`          | CART -> removeProductFromCart                     | Multiple condition coverage |
|  `CartController`   | `clearCart`                      | CART -> clearCart                                 | Multiple condition coverage |
|  `CartController`   | `deleteAllCarts`                 | CART -> deleteAllCarts                            |     Statement coverage      |
|  `CartController`   | `getAllCarts`                    | CART -> getAllCarts                               |     Statement coverage      |
| `ReviewController`  | `addReview`                      | REVIEW -> ReviewController.addReview              | Multiple condition coverage |
| `ReviewController`  | `getProductReviews`              | REVIEW -> ReviewController.getProductReviews      | Multiple condition coverage |
| `ReviewController`  | `deleteReview`                   | REVIEW -> ReviewController.deleteReview           | Multiple condition coverage |
| `ReviewController`  | `deleteReviewsOfProduct`         | REVIEW -> ReviewController.deleteReviewsOfProduct | Multiple condition coverage |
| `ReviewController`  | `deleteAllReviews`               | REVIEW -> ReviewController.deleteAllReviews       |     Statement coverage      |

#### Routes

|                                                                                                                                           Route                                                                                                                                            |                    Test cases                    |       Technique used        |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------: | :-------------------------: |
|                                   POST /ezelectronics/users <br> GET /ezelectronics/users <br> GET /ezelectronics/users/roles/:role <br> GET /ezelectronics/users/:username <br> DELETE /ezelectronics/users/:username <br> DELETE /ezelectronics/users                                    |             USER -> test user routes             |     Statement coverage      |
|                                                                                                                            PATCH /ezelectronics/users/:username                                                                                                                            |   USER -> test user routes -> PATCH /:username   | Multiple condition coverage |
|                                                                                      POST /ezelectronics/sessions <br> DELETE ezelectronics/sessions/current <br> GET ezelectronics/sessions/current                                                                                       |           USER -> test session routes            |     Statement coverage      |
|                                                                                                                                POST /ezelectronics/products                                                                                                                                |     PRODUCT -> POST /ezelectronics/products      | Multiple condition coverage |
|                                                                                                                            PATCH /ezelectronics/products/:model                                                                                                                            |     PRODUCT -> PATCH /ezelectronics/products     | Multiple condition coverage |
|                                                                                                                         PATCH /ezelectronics/products/:model/sell                                                                                                                          |  PRODUCT -> PATCH /ezelectronics/products/sell   | Multiple condition coverage |
|                                                                                                                                GET /ezelectronics/products                                                                                                                                 |      PRODUCT -> GET /ezelectronics/products      | Multiple condition coverage |
|                                                                                                                           GET /ezelectronics/products/available                                                                                                                            | PRODUCT -> GET /ezelectronics/products/available | Multiple condition coverage |
|                                                                                                                               DELETE /ezelectronics/products                                                                                                                               |    PRODUCT -> DELETE /ezelectronics/products     |     Statement coverage      |
|                                                                                                                           DELETE /ezelectronics/products/:model                                                                                                                            | PRODUCT -> DELETE /ezelectronics/products/:model |     Statement coverage      |
| GET /ezelectronics/carts <br> POST /ezelectronics/carts <br> PATCH /ezelectronics/carts <br> GET /ezelectronics/carts/history <br> DELETE /ezelectronics/carts/products/:model <br> DELETE /ezelectronics/carts/current <br> DELETE /ezelectronics/carts <br> GET /ezelectronics/carts/all |                   CART -> all                    |     Statement coverage      |
|                                            POST /ezelectronics/reviews/:model <br> GET /ezelectronics/reviews/:model <br> DELETE /ezelectronics/reviews/:model <br> DELETE /ezelectronics/reviews/:model/all <br> DELETE /ezelectronics/reviews                                            |                  REVIEW -> all                   |     Statement coverage      |

### Integration tests: Black Box

| Route tested                                | Test cases                                  | Technique used                                 |
| :------------------------------------------ | :------------------------------------------ | :--------------------------------------------- |
| POST /ezelectronics/users                   | USER -> POST /users                         | Equivalence partitioning                       |
| GET /ezelectronics/users                    | USER -> GET /users                          | Equivalence partitioning                       |
| GET /ezelectronics/users/roles/:role        | USER -> GET /users/roles/:role              | Equivalence partitioning                       |
| GET /ezelectronics/users/:username          | USER -> GET /users/:username                | Equivalence partitioning                       |
| DELETE /ezelectronics/users/:username       | USER -> DELETE /users/:username             | Equivalence partitioning                       |
| DELETE /ezelectronics/users                 | USER -> DELETE /                            | Equivalence partitioning                       |
| PATCH /ezelectronics/users/:username        | USER -> PATCH /users/:username              | Equivalence partitioning                       |
| POST /ezelectronics/sessions                | USER -> POST /sessions                      | Equivalence partitioning                       |
| DELETE /ezelectronics/sessions/current      | USER -> DELETE /sessions/current            | Equivalence partitioning                       |
| GET /ezelectronics/sessions/current         | USER -> GET /sessions/current               | Equivalence partitioning                       |
| POST /ezelectronics/products                | PRODUCT -> Products registration API tests  | Equivalence partitioning + boundary conditions |
| PATCH /ezelectronics/products/:model        | PRODUCT -> Patch product quantity API tests | Equivalence partitioning + boundary conditions |
| PATCH /ezelectronics/products/:model/sell   | PRODUCT -> Patch product sell API tests     | Equivalence partitioning + boundary conditions |
| GET /ezelectronics/products                 | PRODUCT -> Get all products API tests       | Equivalence partitioning                       |
| GET /ezelectronics/products/available       | PRODUCT -> Get available products API tests | Equivalence partitioning                       |
| DELETE /ezelectronics/products/:model       | PRODUCT -> Delete product API tests         | Equivalence partitioning                       |
| DELETE /ezelectronics/products              | PRODUCT -> Delete all products API tests    | Equivalence partitioning                       |
| GET /ezelectronics/carts                    | CART -> Get current cart                    | Equivalence partitioning + boundary conditions |
| POST /ezelectronics/carts                   | CART -> Post product add to cart            | Equivalence partitioning + boundary conditions |
| PATCH /ezelectronics/carts                  | CART -> Patch checkout cart                 | Equivalence partitioning + boundary conditions |
| GET /ezelectronics/carts/history            | CART -> Get cart history                    | Equivalence partitioning                       |
| DELETE /ezelectronics/carts/products/:model | CART -> Delete product from cart            | Equivalence partitioning + boundary conditions |
| DELETE /ezelectronics/carts                 | CART -> Delete current cart                 | Equivalence partitioning                       |
| DELETE /ezelectronics/carts                 | CART -> Delete all carts of all users       | Equivalence partitioning                       |
| GET /ezelectronics/carts/all                | CART -> Get all carts of all users          | Equivalence partitioning                       |
| POST /ezelectronics/reviews/:model          | REVIEW -> POST /reviews/:model              | Equivalence partitioning + boundary conditions |
| GET /ezelectronics/reviews/:model           | REVIEW -> GET /reviews/:model               | Equivalence partitioning                       |
| DELETE /ezelectronics/reviews/:model        | REVIEW -> DELETE /reviews/:model            | Equivalence partitioning                       |
| DELETE /ezelectronics/reviews/:model/all    | REVIEW -> DELETE /reviews/:model/all        | Equivalence partitioning + boundary conditions |
| DELETE /ezelectronics/reviews               | REVIEW -> DELETE /reviews                   | Equivalence partitioning                       |

## Coverage

### Coverage of FR

<Report in the following table the coverage of functional requirements and scenarios(from official requirements) >

| Functional Requirement or scenario | Test(s) |
| :--------------------------------: | :-----: |
|                FR1                 |         |
|               FR1.1                |         |
|               FR1.2                |         |
|               FR1.3                |         |
|                FR2                 |         |
|               FR2.1                |         |
|               FR2.2                |         |
|               FR2.3                |         |
|               FR2.4                |         |
|               FR2.5                |         |
|               FR2.6                |         |
|                FR3                 |         |
|               FR3.1                |         |
|               FR3.2                |         |
|               FR3.3                |         |
|               FR3.4                |         |
|              FR3.4.1               |         |
|               FR3.5                |         |
|              FR3.5.1               |         |
|               FR3.6                |         |
|              FR3.6.1               |         |
|               FR3.7                |         |
|               FR3.8                |         |
|                FR4                 |         |
|               FR4.1                |         |
|               FR4.2                |         |
|               FR4.3                |         |
|               FR4.4                |         |
|               FR4.5                |         |
|                FR5                 |         |
|               FR5.1                |         |
|               FR5.2                |         |
|               FR5.3                |         |
|               FR5.4                |         |
|               FR5.5                |         |
|               FR5.6                |         |
|               FR5.7                |         |
|               FR5.8                |         |

### Coverage white box

Report here the screenshot of coverage values obtained with jest-- coverage
