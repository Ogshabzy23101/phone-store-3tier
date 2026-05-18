variable "key_pair" {
  description = "private key pair"
  type        = string
}

variable "ami" {
  description = "AMI ID for the instance"
  type        = string
}

variable "instance_type" {
  description = "Instance type for the EC2 instance"
  type        = string
}
variable "aws_region" {
  description = "value of aws region"
  type        = string
}

variable "vpc_name" {
  description = "name of the vpc"
  type        = string
}
variable "azs" {
  description = "availability zone for the vpc "
  type        = list(string)
}

variable "private_subnets" {
  description = "value of provite subnet"
  type        = list(string)
}
variable "public_subnets" {
  description = "value of public subnet"
  type        = list(string)
}
variable "vpc_cidr" {
  description = "value of vpc cidr"
  type        = string
}

variable "cluster_name" {
  description = "kubernetes clauster name"
  type        = string
}

variable "cluster_version" {
  description = "version of the clauster"
  type        = string
}

variable "eks_instance_types" {
  description = "instance type value"
  type        = list(string)
}