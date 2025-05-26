resource "null_resource" "deploy_frontend" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "ansible-playbook -i ../ansible/inventory_frontend.yml ../ansible/playbook.frontend.yml"
  }

  depends_on = [aws_instance.frontend]
}
