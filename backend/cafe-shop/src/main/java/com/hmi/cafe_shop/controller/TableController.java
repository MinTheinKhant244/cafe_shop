package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.TableEntity;
import com.hmi.cafe_shop.service.TableService;
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

    @PostMapping("/create")
    public ResponseEntity<TableEntity> create(@RequestBody TableEntity table) {
        return ResponseEntity.ok(tableService.createTable(table));
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
}