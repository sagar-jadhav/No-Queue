# No-Queue : App based virtual queue management.

## Authors

- Sagar Jadhav
- Noopur Nawage
- Amitabh Prasad
- Chinmay Samant
- Manesh Nambiar

## Contents

1. [Overview](#overview)
2. [The idea](#the-idea)
3. [How it works](#how-it-works)
4. [Diagrams](#diagrams)
5. [Documents](#documents)
6. [Technology](#technology)
7. [Getting started](#getting-started)
8. [Resources](#resources)
9. [License](#license)

## Overview

### What's the problem?

With the Covid-19 situation affecting the entire world population, it is crucial that we maintain adequate social distancing amongst people in all situations.
However in some cases this is not feasiable, especially in queues at Banks, supermarkets, clinics, etc.

What is needed is a solution that enables people to maintain a seamles queue based order, without actually having to physically stand in a queue and risk the spread of the Corona Virus.

### How can technology help?

Mobile, web, and cloud services enable rapid deployment of applications that can be used for addressing such problems. 

## The idea

The goal is to provide a mobile application, that would not only let the end user's see the current size of the queue at a store/service-provider, but also pre-book a slot in the virtual queue.
It would allow both "Suppliers" (such as a store, chemist, clinic, gas station, etc) to make people aware of their serving capacity; and consumers ("Recipients") to locate the current real time length of th queue, and even book a virtual place for themselves in the queue.

## Diagrams

![No-Queue architecture diagram](/images/architecture-diagram.png)

## Technology

### IBM Cloud Services

- [Bot Asset Exchange](https://developer.ibm.com/code/exchanges/bots/)
- [IBM Watson Assistant](https://www.ibm.com/cloud/watson-assistant/)
- [Build a cross-platform mobile app using React Native](https://developer.ibm.com/technologies/mobile/patterns/build-a-cross-platform-mobile-app-to-search-company-news-and-gain-insights)

### HERE Technologies

- [HERE.com API Key](https://developer.here.com/ref/IBM_starterkit_Covid?create=Freemium-Basic)
- [HERE Maps](https://developer.here.com/products/maps)
- [HERE Routing](https://developer.here.com/products/routing)
- [Integrate interactive maps and location features into your application](https://developer.here.com/documentation/)

### Cloudant DB as Backend

### Node.js for backend API 

## Getting started


### Steps


### 1. Run the server

To set up and launch the server application:

1. From a terminal:
    1. Go to the `starter-kit/server-app` directory of the cloned repo.
    1. Install the dependencies: `npm install`.
    1. Launch the server application locally or deploy to IBM Cloud:
        - To run locally:
            1. Start the application: `npm start`.
            1. The server can be accessed at <http://localhost:3000>.
        
### 2. Run the mobile application

To run the mobile application (using the Xcode iOS Simulator):

1. From a terminal:
    1. Go to the `starter-kit/mobile-app` directory.
    1. Install the dependencies: `npm install`.
    1. **iOS only**: Go to the `ios` directory: `cd ios`.
    1. **iOS only**: Install pod dependencies: `pod install`.
    1. **iOS only**: Return to the `mobile-app` directory: `cd ../`.
    1. Launch the app in the simulator/emulator:
        - **iOS only**: `npm run ios`
            > **Note**: You should be running at least iOS 13.0. The first time you launch the simulator, you should ensure that you set a Location in the Features menu.
        - **Android only**: `npm run android`
            > **Note**: Your Android Studio needs to have the `Android 9 (Pie)` SDK and a `Pie API Level 28` virtual device

With the application running in the simulator/emulator, you should be able to navigate through the various screens:

![Home Page](/images/home.png)
![Map Based Search](/images/map_search.png)
![Search and Book](/images/search_n_book.png)
![Chat Screen](/images/chatbot.png)
![Vendor Registeration](/images/vendor_registeration.png)
![Check-in](/images/checkin.png)


## License

This solution starter is made available under the [Apache 2 License](LICENSE).
