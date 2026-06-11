package com.hmi.cafe_shop.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    private static final String SECRET = "mysecretkeymysecretkeymysecretkey_cafe_shop_2026_secured";
    private static final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
    private static final long EXPIRATION_TIME = 86400000;

    public String generateToken(String email, String role) {
        String cleanRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return Jwts.builder()
                .setSubject(email)
                .claim("role", cleanRole)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) { return getClaims(token).getSubject(); }
    public String extractRole(String token) { return getClaims(token).get("role", String.class); }

    public boolean validateToken(String token) {
        try { getClaims(token); return true; } catch (Exception e) { return false; }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }
}