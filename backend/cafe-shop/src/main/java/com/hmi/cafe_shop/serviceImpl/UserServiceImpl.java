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
@Transactional // Class တစ်ခုလုံးအတွက် Transaction စီမံခန့်ခွဲမှု
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User createUser(User user) {
        // Email ပုံစံ မှန်မမှန် validation ထည့်ရန်သင့်သည်
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
        
        // Password အသစ်ပါလာမှသာ encode လုပ်ခြင်း
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
        
        return JwtUtil.generateToken(user.getEmail(), user.getRole());
    }

    @Override
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Random Token တစ်ခု Generate လုပ်ခြင်း
        String resetToken = java.util.UUID.randomUUID().toString();
        user.setResetToken(resetToken); // User entity တွင် resetToken column ရှိရမည်
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15)); // 15 မိနစ်အတွင်းသာ အလုပ်လုပ်မည်
        userRepository.save(user);

        // TODO: ဤနေရာတွင် Email ပို့သည့် Service (JavaMailSender) ကို ခေါ်ယူပါ
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
        user.setResetToken(null); // Token ကို တစ်ခါသုံးပြီးလျှင် ဖျက်ပစ်ပါ
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}