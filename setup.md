# This is a React Expo App. 
## If you just cloned the repo, you will probably need to install several dependencies. See the list below.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies (you can copy the commands below)

   ```bash
   npm install
   npx expo install @supabase/supabase-js
   npx expo install @react-native-google-signin/google-signin
   npx expo install @react-native-async-storage/async-storage
   npx expo install expo-auth-session
   npx expo install expo-auth-session expo-web-browser
   npm install nativewind react-native-reanimated react-native-safe-area-context
   npm install --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo
   npx expo install expo-camera
   npx expo install expo-audio
   npx expo install expo-av
   npx expo install expo-video-thumbnails
   npx expo install expo-video
   ```

2. Get the Supabase key 

    In the main project directory (ie, this repo) create a **.env** file 
    <br> You can use the **.env.example** file as a reference.
    <br>
    ```bash
    EXPO_PUBLIC_SUPABASE_KEY = "your key here"
    ```

3. Start the app

   ```bash
   npx expo start
   ```
<br>

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

