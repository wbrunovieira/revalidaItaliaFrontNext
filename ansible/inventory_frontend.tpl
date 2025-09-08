# inventory_frontend.tpl
all:
  hosts:
    frontend:
      ansible_host: "${public_ip}"
      ansible_user: ubuntu
      ansible_connection: ssh
      ansible_port: 22
      ansible_ssh_private_key_file: "~/.ssh/${key_name}"

  vars:
    NEXT_PUBLIC_API_URL: "${next_public_api_url}"
    storage_type:        "${storage_type}"
    s3_region:           "${s3_region}"
    s3_bucket_name:      "${s3_bucket_name}"
    s3_base_url:         "${s3_base_url}"
    panda_api_key:       "${panda_api_key}"
    max_file_size:       "${max_file_size}"
    allowed_file_types:  "${allowed_file_types}"
    next_public_url:     "${next_public_url}"
    aws_region:          "${s3_region}"