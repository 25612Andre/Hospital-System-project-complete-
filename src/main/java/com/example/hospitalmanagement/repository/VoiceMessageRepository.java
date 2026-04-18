package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.VoiceMessage;
import com.example.hospitalmanagement.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoiceMessageRepository extends JpaRepository<VoiceMessage, Long> {
    List<VoiceMessage> findByRecipientOrderByTimestampDesc(UserAccount recipient);
    List<VoiceMessage> findBySenderOrderByTimestampDesc(UserAccount sender);
    long countByRecipientAndIsReadFalse(UserAccount recipient);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from VoiceMessage v where v.sender.id = :id or v.recipient.id = :id")
    void deleteBySenderOrRecipientId(@org.springframework.data.repository.query.Param("id") Long id);
}
