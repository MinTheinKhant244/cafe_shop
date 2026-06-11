package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<TableEntity, Long> {
    
    List<TableEntity> findByStatus(String status);
    
    long countByStatus(String status);
    
    boolean existsByTableNo(String tableNo);
    
    long countByParentTableId(Long parentTableId);
    
    List<TableEntity> findByParentTableId(Long parentTableId);
    
    List<TableEntity> findByIsMasterTrue();
    
    Optional<TableEntity> findByTableNo(String tableNo);
    
    @Query("SELECT t FROM TableEntity t WHERE t.isMaster = true AND t.parentTableId IS NULL")
    List<TableEntity> findAllMasterTables();
    
    @Query("SELECT t FROM TableEntity t WHERE t.parentTableId = :masterId")
    List<TableEntity> findAllSubTablesByMasterId(@Param("masterId") Long masterId);
    
    // NEW: Update status for master and all its sub tables
    @Modifying
    @Transactional
    @Query("UPDATE TableEntity t SET t.status = :status WHERE t.id = :masterId OR t.parentTableId = :masterId")
    void updateMasterAndSubTablesStatus(@Param("masterId") Long masterId, @Param("status") String status);
}