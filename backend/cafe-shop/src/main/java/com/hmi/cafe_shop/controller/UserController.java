package com.hmi.cafe_shop.controller;

import java.util.List;
import java.util.Map;

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
    
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        userService.forgotPassword(request.get("email"));
        return ResponseEntity.ok("Reset link sent to your email.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        userService.resetPassword(request.get("token"), request.get("newPassword"));
        return ResponseEntity.ok("Password has been reset successfully.");
    }
}