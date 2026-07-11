package com.joveo.apiconnector.transformer;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransformerRepository extends JpaRepository<Transformer, Long> {

    Optional<Transformer> findByApiDetailId(Long apiDetailId);

    List<Transformer> findByApiDetailIsNull();
}
