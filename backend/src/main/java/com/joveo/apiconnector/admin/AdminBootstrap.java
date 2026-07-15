package com.joveo.apiconnector.admin;

import com.joveo.apiconnector.user.Role;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds a single ADMIN account on startup (when {@code app.admin.enabled=true})
 * if one with the configured email does not already exist. Idempotent: safe to
 * run on every boot. The raw password is read from config and never logged.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AdminProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrap(AdminProperties properties,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        if (userRepository.existsByEmail(properties.email())) {
            log.info("Admin bootstrap: account '{}' already exists — skipping.", properties.email());
            return;
        }
        User admin = User.builder()
                .email(properties.email())
                .password(passwordEncoder.encode(properties.password()))
                .fullName(properties.fullName())
                .role(Role.ADMIN)
                .plan(null) // admins have no subscription tier
                .build();
        userRepository.save(admin);
        log.info("Admin bootstrap: created ADMIN account '{}'. Set app.admin.password (ADMIN_PASSWORD) "
                + "to a strong secret in every real environment.", properties.email());
    }
}
