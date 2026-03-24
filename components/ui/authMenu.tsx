import { Button, Dimensions, Platform, TextInput, View, Animated, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState, useRef, useEffect} from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession(); 

//For the auth box, I decided to make the width 35% of the screen. Screen sizes can vary, so I didn't hardcode it.
const boxWidth = Dimensions.get('window').width * 0.35;

export default function SlidingSquare({onSuccessfulLogin}) {
  const [activeTab, setActiveTab] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleTab = (index) => {
    setActiveTab(index);
    Animated.spring(slideAnim, {
      toValue: index * -boxWidth,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Tab Buttons */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={styles.tab} onPress={() => handleTab(0)}>
          <Text style={{ color: activeTab === 0 ? 'white' : 'gray', fontWeight: 'bold' }}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => handleTab(1)}>
          <Text style={{ color: activeTab === 1 ? 'white' : 'gray', fontWeight: 'bold' }}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Content */}
      <View style={styles.mask}>
        <Animated.View style={[styles.track, { transform: [{ translateX: slideAnim }] }]}>
          
          {/* <View style={styles.page}>
            <Text>Content A</Text>
          </View> */}
          <View style={styles.page}>
            <EmailLogin onSuccessfulLogin={onSuccessfulLogin}  />
            <LoginButton onSuccessfulLogin={onSuccessfulLogin}  />
          </View>

          {/* <View style={styles.page}>
            <Text>Content B</Text>
          </View> */}

          <View style={styles.page}>
            <EmailSignUp onSuccessfulLogin={onSuccessfulLogin}  />
            <LoginButton onSuccessfulLogin={onSuccessfulLogin}  />
          </View>

        </Animated.View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: boxWidth,
    // height: boxWidth, // Square
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "black"
  },
  mask: {
    // flex: 1,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    width: boxWidth * 2, // Double width for 2 tabs
    flex: 1,
  },
  page: {
    width: boxWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    width: 300,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
  }
});

export function EmailLogin({onSuccessfulLogin}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const handleEmailLogin = async () => {
      const { data:loginData, error:loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (loginError && loginError.message.includes("Invalid login credentials")) {
        console.log("User not found, account doesn't exist with these credentials");
        setAuthError("Invalid email or password");
      }
      else
        {
          console.log("User signed in:", loginData.user);
          onSuccessfulLogin(loginData.user);
          setAuthError(''); 
          return;
        }
  };

  return (
    <View style={{alignItems: 'center', padding: 20, borderRadius: 10 }}> 
      <View style={{ 
        borderWidth: 2, 
        borderColor: '#333', 
        padding: 20, 
        borderRadius: 15, 
        width: 340,
        backgroundColor: '#fff' 
      }}>
        <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={email} onChangeText={setEmail} placeholder="Email" />
        {/* <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry /> */}
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.passwordInput} 
            value={password} 
            onChangeText={setPassword} 
            placeholder="Password" 
            secureTextEntry={!isPasswordVisible} // 3. Toggle logic
          />
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off" : "eye"} 
              size={24} 
              color="gray" 
            />
          </TouchableOpacity>
        </View>
        {authError && (
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 10, alignSelf: 'flex-start' }}>
            {authError}
          </Text>
        )}
        <Button color = "black" title="Sign in" onPress={handleEmailLogin} />
      </View>
    </View>
  );
}
export function EmailSignUp({onSuccessfulLogin}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); //display_name is stored in user, can access with user.user_metadata.display_name at any time.
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [doPasswordsMatch, setDoPasswordsMatch] = useState(true);


  const passwordsMatch = password === confirmPassword;
  const showMatchError = confirmPassword.length > 0 && !passwordsMatch;
  const showLengthError = passwordsMatch && password.length < 6; //passwords must be at least 6 characters.

  const handleEmailSignUp = async () => {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
        data: {
          display_name: username, // This goes into user_metadata
        },
      }
  });
      if (signUpError) console.error(signUpError.message);
      else {
        console.log("User signed in:", signUpData.user);
        onSuccessfulLogin(signUpData.user); 
      return;
  }
};
  return (
    <View style={{ alignItems: 'center', padding: 20, borderRadius: 10 }}> 
      <View style={{ 
        borderWidth: 2, 
        borderColor: '#333', 
        padding: 20, 
        borderRadius: 15, 
        width: 340,
        backgroundColor: '#fff' 
      }}>
        <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={email} onChangeText={setEmail} placeholder="Email" />
        <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={username} onChangeText={setUsername} placeholder="Username" />
        <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.passwordInput} 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            placeholder="Confirm Password" 
            secureTextEntry={!isConfirmPasswordVisible} 
          />
          <TouchableOpacity 
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={isConfirmPasswordVisible ? "eye-off" : "eye"} 
              size={24} 
              color="gray" 
            />
          </TouchableOpacity>
        </View>
        {showMatchError && (
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 10, alignSelf: 'flex-start' }}>
            Passwords don't match!
          </Text>
        )}

        {showLengthError && (
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 10, alignSelf: 'flex-start' }}>
            Password must be at least 6 characters!
          </Text>
        )}

        {/* 4. Optional: Disable button if they don't match */}
        <Button 
          disabled={(!passwordsMatch && confirmPassword.length > 6)}
          color="black" 
          title="Sign Up" 
          onPress={handleEmailSignUp} 
        />
        {/* <Button color = "black" title="Sign Up" onPress={handleEmailSignUp} /> */}
      </View>
    </View>
  );
}
// function EmailAuth({onSuccessfulLogin}) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

 
      
//       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//         email: email,
//         password: password,
//       });
//       if (signUpError) console.error(signUpError.message);
//       else {
//         console.log("User signed in:", signUpData.user);
//         onSuccessfulLogin(loginData.user); // <--- CALLING THE PROP HERE
//       return;
//       }
//     };
  
//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 10 }}> 
//       <View style={{ 
//         borderWidth: 2, 
//         borderColor: '#333', 
//         padding: 20, 
//         borderRadius: 15, 
//         width: 340,
//         backgroundColor: '#fff' 
//       }}>
//         <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={email} onChangeText={setEmail} placeholder="Email" />
//         <TextInput style = {{ borderWidth: 1, width: 300, borderColor: 'gray', padding: 10, marginBottom: 10 }} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
//         <Button color = "black" title="Sign in or Sign Up" onPress={handleEmailLogin} />
//       </View>
//     </View>
//   );
// }

 export function LoginButton({onSuccessfulLogin}) {
  const handleLogin = async () => {
    if (Platform.OS === 'web') {
      // Web: simple redirect
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) console.error("Login error:", error.message);
      

    } else {
      const redirectTo = Linking.createURL('/', { scheme: 'memoriacam' });
      console.log("Redirect URI:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // crucial — don't auto-redirect, we handle it
        },
      });

      if (error) { console.error("OAuth error:", error.message); return; }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type === 'success' && result.url) {
          // Supabase returns tokens as hash fragments (#access_token=...) not query params
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
              console.error("Error fetching user after OAuth login:", userError.message);
            } else {
              console.log("User logged in via OAuth:", userData.user);
              onSuccessfulLogin(userData.user);
              return;
            }
          } else {
            console.error("Missing tokens in redirect URL:", url);
          }
        }
      }
    }
  };

  return (

    <TouchableOpacity onPress={handleLogin} style={{ marginTop: 20 }}>
      <Image 
      style = {{ width: 40, height: 40 }}
        source={require('../../assets/images/google-icon.png')} 
       
      />
    </TouchableOpacity>
  );
  //   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //     <Button title="Sign in with Google" onPress={handleLogin} />
  //   </View>
  // );
}


export function SignOutButton({onSuccessfulLogin}) {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error.message);
    else{
      console.log("User signed out successfully");
      onSuccessfulLogin
    } 
  };

  return (
    <View style={{ paddingVertical: 10 }}>
      <Button title="Sign Out" onPress={handleSignOut} color="#FF3B30" /> 
    </View>
  );
}
