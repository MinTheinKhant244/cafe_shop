package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.TableEntity;
import com.hmi.cafe_shop.repository.TableRepository;
import com.hmi.cafe_shop.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TableServiceImpl implements TableService {

    @Autowired
    private TableRepository tableRepository;

    @Override
    public TableEntity createTable(TableEntity table) {
        if (tableRepository.existsByTableNo(table.getTableNo())) {
            throw new RuntimeException("Table number " + table.getTableNo() + " already exists!");
        }
        table.setMaster(table.isMaster());
        table.setParentTableId(null);
        table.setStatus("AVAILABLE");
        return tableRepository.save(table);
    }

    @Override
    public Optional<TableEntity> getTableById(Long id) {
        return tableRepository.findById(id);
    }

    @Override
    public List<TableEntity> getAllTables() {
        List<TableEntity> tables = tableRepository.findAll();
        
        for (TableEntity table : tables) {
            if (table.isMaster() && table.getParentTableId() == null) {
                List<TableEntity> subTables = tableRepository.findByParentTableId(table.getId());
                table.setSubTables(subTables);
            }
        }
        return tables;
    }

    @Override
    public List<TableEntity> getTablesByStatus(String status) {
        return tableRepository.findByStatus(status);
    }

    @Override
    @Transactional
    public TableEntity updateTableStatus(Long id, String status) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        
        // Check if it's a sub table (cannot modify individually)
        if (table.getParentTableId() != null) {
            throw new RuntimeException("Cannot modify merged sub table individually. Please unmerge first or change master table status.");
        }
        
        // NEW: If it's a master table with sub tables, update all sub tables too
        if (table.isMaster()) {
            List<TableEntity> subTables = tableRepository.findByParentTableId(table.getId());
            if (subTables != null && !subTables.isEmpty()) {
                // Update all sub tables to same status
                for (TableEntity sub : subTables) {
                    sub.setStatus(status);
                    tableRepository.save(sub);
                }
            }
        }
        
        // Update master table status
        table.setStatus(status);
        
        return tableRepository.save(table);
    }

    @Override
    @Transactional
    public void deleteTable(Long id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        
        if (table.isMaster()) {
            long subTableCount = tableRepository.countByParentTableId(table.getId());
            if (subTableCount > 0) {
                throw new RuntimeException("Cannot delete master table that has " + subTableCount + " sub table(s). Please unmerge first.");
            }
        }
        
        if (table.getParentTableId() != null) {
            table.setParentTableId(null);
            tableRepository.save(table);
        }
        
        tableRepository.deleteById(id);
    }
    
    @Override
    @Transactional
    public TableEntity setTableAsMaster(Long id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        
        if (table.getParentTableId() != null) {
            throw new RuntimeException("Cannot set a sub table as master. Please unmerge first.");
        }
        
        if (table.isMaster()) {
            throw new RuntimeException("Table is already a master table");
        }
        
        table.setMaster(true);
        table.setParentTableId(null);
        return tableRepository.save(table);
    }
    
    @Override
    @Transactional
    public TableEntity removeMaster(Long id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        
        if (!table.isMaster()) {
            throw new RuntimeException("Table is not a master table");
        }
        
        List<TableEntity> subTables = tableRepository.findByParentTableId(id);
        
        if (subTables != null && !subTables.isEmpty()) {
            for (TableEntity subTable : subTables) {
                subTable.setParentTableId(null);
                subTable.setMaster(false);
                tableRepository.save(subTable);
            }
        }
        
        table.setMaster(false);
        table.setParentTableId(null);
        
        return tableRepository.save(table);
    }
    
    @Override
    @Transactional
    public void mergeTables(Long masterTableId, Long subTableId) {
        TableEntity master = tableRepository.findById(masterTableId)
                .orElseThrow(() -> new RuntimeException("Master table not found"));
        
        TableEntity sub = tableRepository.findById(subTableId)
                .orElseThrow(() -> new RuntimeException("Sub table not found"));
        
        if (!master.isMaster()) {
            throw new RuntimeException("Selected table is not a master table. Please set it as master first.");
        }
        
        if (sub.isMaster()) {
            throw new RuntimeException("Cannot merge a master table as a sub table.");
        }
        
        if (sub.getParentTableId() != null) {
            throw new RuntimeException("Table " + sub.getTableNo() + " is already merged to another master. Please unmerge first.");
        }
        
        if (masterTableId.equals(subTableId)) {
            throw new RuntimeException("Cannot merge a table with itself.");
        }
        
        List<TableEntity> existingSubs = tableRepository.findByParentTableId(masterTableId);
        if (existingSubs.stream().anyMatch(t -> t.getId().equals(subTableId))) {
            throw new RuntimeException("This table is already a sub table of this master.");
        }
        
        master.setMaster(true);
        tableRepository.save(master);
        
        sub.setParentTableId(masterTableId);
        sub.setMaster(false);
        
        // NEW: When merging, sub table inherits master's status
        sub.setStatus(master.getStatus());
        
        tableRepository.save(sub);
    }

    @Override
    @Transactional
    public void unmergeTable(Long subTableId) {
        TableEntity sub = tableRepository.findById(subTableId)
                .orElseThrow(() -> new RuntimeException("Table not found"));

        Long masterId = sub.getParentTableId();
        
        if (masterId == null) {
            throw new RuntimeException("This table is not merged to any master!");
        }

        sub.setParentTableId(null);
        sub.setMaster(false);
        // Keep current status when unmerging
        tableRepository.save(sub);

        long remainingSubs = tableRepository.countByParentTableId(masterId);
        if (remainingSubs == 0) {
            // Master remains master even without sub tables
        }
    }
}