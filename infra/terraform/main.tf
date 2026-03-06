provider "aws" {
  region = "eu-west-2"
  profile = "devops-capstone"
}
data "aws_vpc" "default" {
  default = true
  
}




resource "aws_security_group" "tier3_sg" {
  name = "tier3-security-group"
  description = "Security group for tier3 phone instance"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "tier3-phone" {
  region = "eu-west-2"
  ami = var.ami
  instance_type = var.instance_type
  tags = {
    Name = "tier3-phone"}

  vpc_security_group_ids = [aws_security_group.tier3_sg.id]
  key_name = var.key_pair
}

resource "aws_eip" "tier3_eip" {
  instance = aws_instance.tier3-phone.id
  domain = "vpc" 
}