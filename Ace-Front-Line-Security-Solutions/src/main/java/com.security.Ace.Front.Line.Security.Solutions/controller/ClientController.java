package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {
    
    private final ClientService clientService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<ClientResponse>> registerClient(
            @Valid @RequestBody ClientRegistrationRequest request) {
        
        ClientResponse response = clientService.registerClient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Client registered successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getAllClients() {
        List<ClientResponse> clients = clientService.getAllClients();
        return ResponseEntity.ok(ApiResponse.success("Clients retrieved successfully", clients));
    }
    
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getActiveClients() {
        List<ClientResponse> clients = clientService.getActiveClients();
        return ResponseEntity.ok(ApiResponse.success("Active clients retrieved successfully", clients));
    }
    
    @GetMapping("/{clientId}")
    public ResponseEntity<ApiResponse<ClientResponse>> getClientById(@PathVariable Integer clientId) {
        ClientResponse client = clientService.getClientById(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client retrieved successfully", client));
    }
    
    @PutMapping("/{clientId}")
    public ResponseEntity<ApiResponse<ClientResponse>> updateClient(
            @PathVariable Integer clientId,
            @Valid @RequestBody ClientUpdateRequest request) {
        
        ClientResponse response = clientService.updateClient(clientId, request);
        return ResponseEntity.ok(ApiResponse.success("Client updated successfully", response));
    }
    
    @PutMapping("/{clientId}/suspend")
    public ResponseEntity<ApiResponse<String>> suspendClient(@PathVariable Integer clientId) {
        clientService.suspendClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client suspended successfully", null));
    }
    
    @PutMapping("/{clientId}/terminate")
    public ResponseEntity<ApiResponse<String>> terminateClient(@PathVariable Integer clientId) {
        clientService.terminateClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client terminated successfully", null));
    }
    
    @PutMapping("/{clientId}/reactivate")
    public ResponseEntity<ApiResponse<String>> reactivateClient(@PathVariable Integer clientId) {
        clientService.reactivateClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client reactivated successfully", null));
    }
}
