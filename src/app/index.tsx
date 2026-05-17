import { Redirect } from 'expo-router';

export default function Index() {
  // Safely redirect the root route to the main home tab
  // In the future, you can add auth-checking logic here to redirect to /(auth)/login instead
  return <Redirect href="/(tabs)/home" />;
}
