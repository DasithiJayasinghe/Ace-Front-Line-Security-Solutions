package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/officers")
@CrossOrigin(origins = "*")
public class OfficerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdvanceRequestRepository advanceRequestRepository;

    @GetMapping("/list")
    public ResponseEntity<List<User>> getAllOfficers() {
        return ResponseEntity.ok(userRepository.findByRole(Role.SECURITY_OFFICER));
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("success");
    }

    @GetMapping("/debug/advances")
    public ResponseEntity<?> debugAdvances() {
        return ResponseEntity.ok(advanceRequestRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getOfficerDetails(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
