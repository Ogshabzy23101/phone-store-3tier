variable "key_pair" {
  default = "Devon-capstone"
  description = "private key pair" 
}

variable "ami" {
  default = "ami-018ff7ece22bf96db"
  description = "AMI ID for the instance"
}

variable "instance_type" {
  default = "t3.micro"
  description = "Instance type for the EC2 instance"
}