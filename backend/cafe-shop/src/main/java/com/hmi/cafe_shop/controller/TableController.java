package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.TableEntity;
import com.hmi.cafe_shop.service.TableService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "*")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTable(@RequestBody TableEntity table) {
        try {
            TableEntity newTable = tableService.createTable(table);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Table created successfully");
            response.put("table", newTable);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
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

    @PatchMapping("/update-status/{id}")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            TableEntity updatedTable = tableService.updateTableStatus(id, status);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Status updated successfully");
            response.put("table", updatedTable);
            return ResponseEntity.ok(updatedTable);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            tableService.deleteTable(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Table Deleted Successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    @PostMapping("/set-master/{id}")
    public ResponseEntity<?> setMaster(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tableService.setTableAsMaster(id));
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    @PostMapping("/remove-master/{id}")
    public ResponseEntity<?> removeMaster(@PathVariable Long id) {
        try {
            TableEntity table = tableService.removeMaster(id);
            return ResponseEntity.ok(table);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
    
    @PostMapping("/merge")
    public ResponseEntity<?> mergeTables(@RequestParam Long masterTableId, @RequestParam Long subTableId) {
        try {
            tableService.mergeTables(masterTableId, subTableId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Tables merged successfully.");
            response.put("masterTableId", String.valueOf(masterTableId));
            response.put("subTableId", String.valueOf(subTableId));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/unmerge/{subTableId}")
    public ResponseEntity<?> unmergeTable(@PathVariable Long subTableId) {
        try {
            tableService.unmergeTable(subTableId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Table unmerged successfully.");
            response.put("subTableId", String.valueOf(subTableId));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}