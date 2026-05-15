package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByPoNo(String poNo);
    List<PurchaseOrder> findByStatus(String status);
}