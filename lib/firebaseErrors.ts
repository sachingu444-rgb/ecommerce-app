const authErrorMap: Record<string, string> = {
  "auth/user-not-found": "No account found with this email",
  "auth/wrong-password": "Incorrect password. Please try again",
  "auth/invalid-credential": "Email or password is incorrect",
  "auth/too-many-requests": "Too many attempts. Please wait",
  "auth/network-request-failed": "No internet. Check connection",
  "auth/email-already-in-use": "An account already exists with this email",
  "auth/invalid-email": "Please enter a valid email address",
  "auth/weak-password": "Password should be at least 6 characters",
  "auth/missing-password": "Please enter your password",
};

export const getFirebaseAuthErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: string }).code === "string"
  ) {
    return authErrorMap[(error as { code: string }).code] || "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
};

export const getFirebaseGenericErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: string }).code === "string"
  ) {
    const code = (error as { code: string }).code;

    if (code === "permission-denied" || code === "storage/unauthorized") {
      return "Permission denied. Check Firebase login state and your development rules.";
    }

    if (code === "storage/unknown") {
      return "Image upload failed. Check Firebase Storage setup, Storage rules, and your bucket configuration.";
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: string }).message === "string"
  ) {
    const message = (error as { message: string }).message.toLowerCase();

    if (message.includes("missing or insufficient permissions")) {
      return "Permission denied. Firestore or Storage rules are blocking this request.";
    }

    if (message.includes("network")) {
      return "No internet. Check connection";
    }
  }

  return fallback;
};
