package com.hmi.cafe_shop.serviceImpl;

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
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setIsActive(true);
        return userRepository.save(user);
    }

    @Override
    public User updateUser(User user, Long id) {
        User oldUser = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        oldUser.setName(user.getName());
        oldUser.setRole(user.getRole());
        oldUser.setIsActive(user.getIsActive());
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            oldUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(oldUser);
    }

    @Override
    public User activateUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(true);
        return userRepository.save(user);
    }

    @Override
    public User deactivateUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        return userRepository.save(user);
    }

    @Override public Optional<User> getUserById(Long id) { return userRepository.findById(id); }
    @Override public List<User> getAllUsers() { return userRepository.findAll(); }
    @Override public List<User> getActiveUsers() { return userRepository.findByIsActiveTrue(); }
    @Override public Optional<User> getUserByEmail(String email) { return userRepository.findByEmail(email); }

    @Override
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(password, user.getPassword())) throw new RuntimeException("Invalid password");
        if (!user.getIsActive()) throw new RuntimeException("User is inactive");
        return JwtUtil.generateToken(user.getEmail(), user.getRole());
    }
}