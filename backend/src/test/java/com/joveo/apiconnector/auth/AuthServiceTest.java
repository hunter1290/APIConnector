package com.joveo.apiconnector.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.joveo.apiconnector.auth.dto.AuthResponse;
import com.joveo.apiconnector.auth.dto.LoginRequest;
import com.joveo.apiconnector.auth.dto.RegisterRequest;
import com.joveo.apiconnector.common.exception.EmailAlreadyExistsException;
import com.joveo.apiconnector.security.JwtProperties;
import com.joveo.apiconnector.security.JwtService;
import com.joveo.apiconnector.user.Role;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import com.joveo.apiconnector.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Unit tests for {@link AuthService} with all collaborators mocked (no Spring context, no DB). */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    // A record can't be mocked with @Mock; supply a real value object.
    private final JwtProperties jwtProperties = new JwtProperties("secret", 3_600_000L);

    private AuthService authService() {
        return new AuthService(userRepository, passwordEncoder, jwtService, jwtProperties, authenticationManager);
    }

    @Test
    @DisplayName("register hashes the password, persists a USER/REGULAR account, and returns a token")
    void registerCreatesUserAndReturnsToken() {
        RegisterRequest request = new RegisterRequest("new@example.com", "password123", "New User");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-pw");
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService().register(request);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresInMs()).isEqualTo(3_600_000L);
        assertThat(response.user().email()).isEqualTo("new@example.com");
        assertThat(response.user().fullName()).isEqualTo("New User");
        assertThat(response.user().role()).isEqualTo("USER");

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isEqualTo("hashed-pw");
        assertThat(saved.getValue().getRole()).isEqualTo(Role.USER);
        assertThat(saved.getValue().getPlan()).isEqualTo(UserPlan.REGULAR);
    }

    @Test
    @DisplayName("register rejects a duplicate email without hashing or saving")
    void registerRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("dup@example.com", "password123", "Dup User");
        when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService().register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("dup@example.com");

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    @DisplayName("login authenticates the credentials and returns a token for the found user")
    void loginAuthenticatesAndReturnsToken() {
        LoginRequest request = new LoginRequest("alice@example.com", "password123");
        User user = User.builder()
                .id(7L)
                .email("alice@example.com")
                .password("hashed-pw")
                .fullName("Alice")
                .role(Role.USER)
                .plan(UserPlan.PRO)
                .build();
        Authentication authenticated =
                new UsernamePasswordAuthenticationToken("alice@example.com", "password123");
        when(authenticationManager.authenticate(any())).thenReturn(authenticated);
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        AuthResponse response = authService().login(request);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().id()).isEqualTo(7L);
        assertThat(response.user().email()).isEqualTo("alice@example.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login propagates the authentication failure and never issues a token")
    void loginPropagatesBadCredentials() {
        LoginRequest request = new LoginRequest("alice@example.com", "wrong");
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService().login(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByEmail(any());
        verify(jwtService, never()).generateToken(any(User.class));
    }
}
