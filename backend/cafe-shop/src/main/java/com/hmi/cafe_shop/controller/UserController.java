package com.hmi.cafe_shop.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hmi.cafe_shop.entity.User;
import com.hmi.cafe_shop.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    public UserController(UserService userService) { this.userService = userService; }

    @PostMapping("/create")
    public ResponseEntity<User> createUser(@RequestBody User user) { return ResponseEntity.ok(userService.createUser(user)); }

    @PutMapping("/update/{id}")
    public ResponseEntity<User> updateUser(@RequestBody User user, @PathVariable Long id) { return ResponseEntity.ok(userService.updateUser(user, id)); }

    @PutMapping("/activate/{id}")
    public ResponseEntity<User> activateUser(@PathVariable Long id) { return ResponseEntity.ok(userService.activateUser(id)); }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<User> deactivateUser(@PathVariable Long id) { return ResponseEntity.ok(userService.deactivateUser(id)); }

    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() { return ResponseEntity.ok(userService.getAllUsers()); }

    @GetMapping("/active")
    public ResponseEntity<List<User>> getActiveUsers() { return ResponseEntity.ok(userService.getActiveUsers()); }
}