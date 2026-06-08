package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.TableEntity;
import java.util.List;
import java.util.Optional;

public interface TableService {
    TableEntity createTable(TableEntity table);
    Optional<TableEntity> getTableById(Long id);
    List<TableEntity> getAllTables();
    List<TableEntity> getTablesByStatus(String status);
    TableEntity updateTableStatus(Long id, String status);
    void deleteTable(Long id);
}