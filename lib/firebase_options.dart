import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return web;
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBqEqWFe2C6HqQmNgHtYrUykrHvtKQqRL0',
    appId: '1:25840353255:web:b285ed8fc6180934a08742',
    messagingSenderId: '25840353255',
    projectId: 'mi-cartera-7bd21',
    authDomain: 'mi-cartera-7bd21.firebaseapp.com',
    storageBucket: 'mi-cartera-7bd21.firebasestorage.app',
  );
}
