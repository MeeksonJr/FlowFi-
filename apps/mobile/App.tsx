import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import { supabase } from './lib/supabase';
import ReceiptCamera from './components/ReceiptCamera';
import { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (session && session.user) {
    return <Dashboard session={session} />;
  }

  return <Auth />;
}

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FlowFi Mobile Auth</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="email@address.com"
        autoCapitalize={'none'}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry={true}
        placeholder="Password"
        autoCapitalize={'none'}
      />
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true);
        if (!session?.user) throw new Error('No user on the session!');
        const { data, error, status } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session?.user.id)
          .single();
        if (error && status !== 406) {
          throw error;
        }
        if (data) {
          setRole(data.role || '');
        }
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert(error.message);
        }
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, [session]);

  if (showCamera) {
    return (
      <View style={{ flex: 1, marginTop: 40 }}>
        <Button title="Back to Dashboard" onPress={() => setShowCamera(false)} />
        <View style={{ flex: 1 }}>
          <ReceiptCamera />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Welcome {session.user.email}</Text>
      <Text>Your role is: {role || 'Not set'}</Text>
      
      <View style={styles.mt20}>
        <Button title="Scan Receipt" onPress={() => setShowCamera(true)} />
      </View>

      <View style={styles.mt20}>
        <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
