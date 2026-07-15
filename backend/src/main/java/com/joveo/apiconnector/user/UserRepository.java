package com.joveo.apiconnector.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Accounts of a given role (e.g. all normal USER accounts for admin monitoring). */
    List<User> findByRoleOrderByIdAsc(Role role);

    long countByRole(Role role);
}
