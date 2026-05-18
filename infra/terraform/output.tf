output "ec2_ip" {
  value = aws_eip.tier3_eip.public_ip
}
