declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "react" {
  export type ReactNode = any;
  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };
  export function useState<T = any>(
    initialState: T | (() => T)
  ): [T, (value: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: (...args: any[]) => any, deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
  export function useRef<T = any>(initialValue: T): { current: T };
  export function useContext<T = any>(context: any): T;
  export function createContext<T = any>(value?: T): any;
  const React: any;
  export default React;
}

declare module "react-native" {
  export type StyleProp<T> = any;
  export type TextInputProps = any;
  export interface ImageStyle {}
  export interface ViewStyle {}
  export interface TextStyle {}
  export const View: any;
  export const Text: any;
  export const ScrollView: any;
  export const SafeAreaView: any;
  export const Pressable: any;
  export const ActivityIndicator: any;
  export const TextInput: any;
  export const KeyboardAvoidingView: any;
  export const Image: any;
  export const ImageBackground: any;
  export const Switch: any;
  export const Animated: any;
  export const Alert: any;
  export const Linking: any;
  export const PermissionsAndroid: any;
  export const Platform: any;
  export const Dimensions: any;
  export const useWindowDimensions: any;
  export const StatusBar: any;
}

declare module "expo-router" {
  export const Stack: any;
  export const Tabs: any;
  export const Link: any;
  export const Redirect: any;
  export function useRouter(): any;
  export function usePathname(): string;
  export function useSegments(): string[];
  export function useLocalSearchParams<T = any>(): T;
}

declare module "expo-status-bar" {
  export const StatusBar: any;
}

declare module "react-native-gesture-handler" {
  export const GestureHandlerRootView: any;
}

declare module "react-native-toast-message" {
  const Toast: any;
  export default Toast;
}

declare module "@stripe/stripe-react-native" {
  export const StripeProvider: any;
  export function useStripe(): {
    initPaymentSheet: (...args: any[]) => Promise<any>;
    presentPaymentSheet: (...args: any[]) => Promise<any>;
  };
}

declare module "@expo/vector-icons" {
  export const Ionicons: any;
}

declare module "expo-linear-gradient" {
  export const LinearGradient: any;
}

declare module "expo-image-picker" {
  export interface ImagePickerAsset {
    uri: string;
    fileName?: string;
  }
  export const MediaTypeOptions: any;
  export function getMediaLibraryPermissionsAsync(): Promise<{
    granted: boolean;
    canAskAgain?: boolean;
    status?: string;
  }>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{
    granted: boolean;
    canAskAgain?: boolean;
    status?: string;
  }>;
  export function launchImageLibraryAsync(options?: any): Promise<{
    canceled: boolean;
    assets: ImagePickerAsset[];
  }>;
}

declare module "@react-navigation/native" {
  export function useFocusEffect(effect: (...args: any[]) => any): void;
}

declare module "zustand" {
  export function create<T = any>(creator: any): any;
}

declare module "firebase/app" {
  export function initializeApp(...args: any[]): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module "firebase/auth" {
  export type User = any;
  export function getAuth(...args: any[]): any;
  export function onAuthStateChanged(...args: any[]): any;
  export function signInWithEmailAndPassword(...args: any[]): Promise<any>;
  export function createUserWithEmailAndPassword(...args: any[]): Promise<any>;
  export function updateProfile(...args: any[]): Promise<any>;
  export function sendPasswordResetEmail(...args: any[]): Promise<any>;
  export function signOut(...args: any[]): Promise<any>;
}

declare module "firebase/firestore" {
  export function getFirestore(...args: any[]): any;
  export function addDoc(...args: any[]): Promise<any>;
  export function doc(...args: any[]): any;
  export function getDoc(...args: any[]): Promise<any>;
  export function setDoc(...args: any[]): Promise<any>;
  export function updateDoc(...args: any[]): Promise<any>;
  export function deleteDoc(...args: any[]): Promise<any>;
  export function onSnapshot(...args: any[]): any;
  export function serverTimestamp(): any;
  export function collection(...args: any[]): any;
  export function getDocs(...args: any[]): Promise<any>;
  export function query(...args: any[]): any;
  export function orderBy(...args: any[]): any;
  export function where(...args: any[]): any;
  export function limit(...args: any[]): any;
  export function runTransaction(...args: any[]): Promise<any>;
  export function arrayRemove(...args: any[]): any;
  export function arrayUnion(...args: any[]): any;
}

declare module "firebase/storage" {
  export function getStorage(...args: any[]): any;
  export function ref(...args: any[]): any;
  export function uploadBytesResumable(...args: any[]): any;
  export function getDownloadURL(...args: any[]): Promise<any>;
}

declare module "firebase/functions" {
  export function getFunctions(...args: any[]): any;
  export function httpsCallable(...args: any[]): any;
}

declare module "firebase-admin/app" {
  export function initializeApp(...args: any[]): any;
}

declare module "firebase-functions/params" {
  export function defineSecret(...args: any[]): any;
}

declare module "firebase-functions/v2/https" {
  export class HttpsError extends Error {
    constructor(code: string, message: string);
  }
  export function onCall(...args: any[]): any;
}

declare module "stripe" {
  class Stripe {
    static LatestApiVersion: any;
    constructor(...args: any[]);
    customers: any;
    ephemeralKeys: any;
    paymentIntents: any;
  }
  export = Stripe;
}
