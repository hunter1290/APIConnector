package com.joveo.apiconnector.auth;

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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Handles user registration and login, issuing JWT access tokens. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       JwtProperties jwtProperties,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(Role.USER)
                .plan(UserPlan.REGULAR)
                .build();
        userRepository.save(user);
        return buildResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Throws AuthenticationException on bad credentials (handled globally -> 401).
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmail(request.email()).orElseThrow();
        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(
                token,
                "Bearer",
                jwtProperties.expirationMs(),
                new AuthResponse.UserSummary(
                        user.getId(), user.getEmail(), user.getFullName(), user.getRole().name()));
    }
}
