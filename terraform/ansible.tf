resource "local_file" "ansible_inventory_frontend" {
  filename = "${path.module}/../ansible/inventory_frontend.yml"

  content = templatefile(
    "${path.module}/../ansible/inventory_frontend.tpl",
    {
      public_ip       = aws_instance.frontend.public_ip,
      key_name        = aws_key_pair.revalida.key_name,
      next_public_url = var.NEXT_PUBLIC_URL

    }
  )
}

resource "null_resource" "wait_for_ssh_frontend" {
  provisioner "local-exec" {
    command = <<-EOT
      until ssh -o StrictHostKeyChecking=no \
                -i "${var.private_key_path}" \
                ubuntu@${aws_instance.frontend.public_ip} \
                true; do
        sleep 5
      done
      echo "SSH to frontend is ready"
    EOT
  }

  depends_on = [aws_instance.frontend]
}

resource "null_resource" "run_ansible" {
  depends_on = [
    null_resource.wait_for_ssh_frontend,
    local_file.ansible_inventory_frontend
  ]

  triggers = {
    playbook_checksum  = filemd5("${path.module}/../ansible/playbook.frontend.yml")
    inventory_checksum = filemd5("${path.module}/../ansible/inventory_frontend.tpl")
    always_run         = timestamp()
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../ansible"
    command     = "ansible-playbook -i inventory_frontend.yml playbook.frontend.yml"
  }
}
