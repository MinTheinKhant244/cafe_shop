package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.TableEntity;
import com.hmi.cafe_shop.repository.TableRepository;
import com.hmi.cafe_shop.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TableServiceImpl implements TableService {

    @Autowired
    private TableRepository tableRepository;

    @Override
    public TableEntity createTable(TableEntity table) {
        return tableRepository.save(table);
    }

    @Override
    public Optional<TableEntity> getTableById(Long id) {
        return tableRepository.findById(id);
    }

    @Override
    public List<TableEntity> getAllTables() {
        return tableRepository.findAll();
    }

    @Override
    public List<TableEntity> getTablesByStatus(String status) {
        return tableRepository.findByStatus(status);
    }

    @Override
    public TableEntity updateTableStatus(Long id, String status) {
        return tableRepository.findById(id).map(table -> {
            table.setStatus(status);
            return tableRepository.save(table);
        }).orElseThrow(() -> new RuntimeException("Table not found"));
    }

    @Override
    public void deleteTable(Long id) {
        tableRepository.deleteById(id);
    }
}