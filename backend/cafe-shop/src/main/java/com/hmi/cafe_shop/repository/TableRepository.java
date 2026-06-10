package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TableRepository extends JpaRepository<TableEntity, Long> {
    
    List<TableEntity> findByStatus(String status);
    long countByStatus(String status);
    boolean existsByTableNo(String tableNo);
    long countByParentTableId(Long parentTableId);
    
    @Query("SELECT t FROM TableEntity t WHERE t.id = :masterId OR t.parentTableId = :masterId")
    List<TableEntity> findAllTablesInOrder(@Param("masterId") Long masterId);
    
}