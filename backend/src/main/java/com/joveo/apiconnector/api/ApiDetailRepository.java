package com.joveo.apiconnector.api;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiDetailRepository extends JpaRepository<ApiDetail, Long> {

    List<ApiDetail> findByUserId(Long userId);
}
