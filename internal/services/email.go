package services

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

func SendEmail(to []string, subject string, body string) {
	// Skip if no config (dev mode)
	if os.Getenv("SMTP_HOST") == "" {
		log.Println("[Email Mock] To:", to, "Subject:", subject)
		log.Println("Body:", body)
		return
	}

	port, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	m := gomail.NewMessage()
	m.SetHeader("From", os.Getenv("SMTP_USER"))
	m.SetHeader("To", to...)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(
		os.Getenv("SMTP_HOST"),
		port,
		os.Getenv("SMTP_USER"),
		os.Getenv("SMTP_PASS"),
	)

	if err := d.DialAndSend(m); err != nil {
		log.Println("Failed to send email:", err)
	} else {
		log.Println("Email sent successfully to:", to)
	}
}

func SendNewRequestNotification(technicianEmail string, userEmail string, subject string, equipmentName string) {
	// Notify Technician
	if technicianEmail != "" {
		body := fmt.Sprintf("<h3>New Task Assigned</h3><p>You have been assigned to check <b>%s</b>.</p><p>Issue: %s</p>", equipmentName, subject)
		go SendEmail([]string{technicianEmail}, "New Maintenance Task: "+subject, body)
	}

	// Notify Creator
	if userEmail != "" {
		body := fmt.Sprintf("<h3>Request Received</h3><p>Your request for <b>%s</b> has been logged.</p>", equipmentName)
		go SendEmail([]string{userEmail}, "Request Confirmation: "+subject, body)
	}
}
