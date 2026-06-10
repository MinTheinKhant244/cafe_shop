package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.TableEntity;
import com.hmi.cafe_shop.service.TableService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "*")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

 // TableController.java
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody TableEntity table) {
        try {
            return ResponseEntity.ok(tableService.createTable(table));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<TableEntity>> getAll() {
        return ResponseEntity.ok(tableService.getAllTables());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TableEntity>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(tableService.getTablesByStatus(status));
    }

    @PatchMapping("/update-status/{id}") // Status တစ်ခုတည်း ပြင်မှာမို့ PatchMapping က ပိုသင့်တော်ပါတယ်
    public ResponseEntity<TableEntity> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(tableService.updateTableStatus(id, status));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok("Table Deleted Successfully");
    }
    
    @PostMapping("/set-master/{id}")
    public ResponseEntity<TableEntity> setMaster(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tableService.setTableAsMaster(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
    
    @PostMapping("/merge")
    public ResponseEntity<String> mergeTables(@RequestParam Long masterTableId, @RequestParam Long subTableId) {
        try {
            tableService.mergeTables(masterTableId, subTableId);
            return ResponseEntity.ok("Tables merged successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/unmerge/{subTableId}")
    public ResponseEntity<String> unmergeTable(@PathVariable Long subTableId) {
        try {
            tableService.unmergeTable(subTableId);
            return ResponseEntity.ok("Table unmerged successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}