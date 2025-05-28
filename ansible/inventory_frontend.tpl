all:
  hosts:
    frontend:
      # conecta no IP que o Terraform passa
      ansible_host: '${public_ip}'
      ansible_user: ubuntu
      ansible_connection: ssh
      ansible_port: 22
      ansible_ssh_private_key_file: '~/.ssh/${key_name}'

  vars:
    NEXT_PUBLIC_API_URL: "${next_public_api_url}"
