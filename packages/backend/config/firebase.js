import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

// Firebase Admin app instance
let app = null
let isInitialized = false

// Lazy initialization function
function initializeFirebaseAdmin() {
  if (isInitialized) {
    return app
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Production: Use service account key from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      console.log('Firebase Admin initialized')
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Development: Use service account file path
      let serviceAccountPath
      
      // Check if it's an absolute path
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH.startsWith('/')) {
        serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      } else {
        // Relative path - resolve from this module's location
        serviceAccountPath = fileURLToPath(new URL(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, import.meta.url))
      }
      
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      
      console.log('Firebase Admin initialized')
    } else {
      console.warn('Firebase Admin not initialized: No service account configuration found')
    }
    
    isInitialized = true
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message)
  }
  
  return app
}

// Get Firebase Auth instance (with lazy initialization)
export const getAuth = () => {
  const firebaseApp = initializeFirebaseAdmin()
  return firebaseApp ? admin.auth() : null
}

export { admin }
export default app