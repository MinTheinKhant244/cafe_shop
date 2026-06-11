package com.hmi.cafe_shop.serviceImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hmi.cafe_shop.security.JwtUtil;
import com.hmi.cafe_shop.service.UserService;
import com.hmi.cafe_shop.entity.User;
import com.hmi.cafe_shop.repository.UserRepository;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Correct Constructor Injection for all dependencies
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public User createUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + user.getEmail());
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setIsActive(true);
        return userRepository.save(user);
    }

    @Override
    public User updateUser(User user, Long id) {
        User oldUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        oldUser.setName(user.getName());
        oldUser.setRole(user.getRole());
        oldUser.setIsActive(user.getIsActive());
        
        if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
            oldUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(oldUser);
    }

    @Override
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(true);
        return userRepository.save(user);
    }

    @Override
    public User deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserById(Long id) { return userRepository.findById(id); }

    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() { return userRepository.findAll(); }

    @Override
    @Transactional(readOnly = true)
    public List<User> getActiveUsers() { return userRepository.findByIsActiveTrue(); }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) { return userRepository.findByEmail(email); }

    @Override
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Ensure role is converted to String safely
        String roleStr = (user.getRole() != null) ? user.getRole().toString() : "ROLE_USER";
        return jwtUtil.generateToken(user.getEmail(), roleStr);
    }

    @Override
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String resetToken = java.util.UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);
        
        System.out.println("Reset Token: " + resetToken); 
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}