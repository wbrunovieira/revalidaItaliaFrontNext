    1.	Descomentar o prevent_destroy no terraform/keypair.tf
    2.  Inicializar o Terraform
      terraform init
    3.	Importar o Key Pair existente
      terraform import aws_key_pair.revalida revalida-key
    4.	Importar o Security Group do frontend
    	Primeiro descubra o ID:
      aws ec2 describe-security-groups \
        --profile bruno-admin-revalida-aws \
        --region us-east-2 \
        --filters Name=group-name,Values=frontend-sg \
        --query 'SecurityGroups[0].GroupId' --output text
     5. terraform import aws_security_group.frontend_sg <SG_ID_AQUI>

<!-- aws ec2 import-key-pair \
 --profile bruno-admin-revalida-aws \
 --key-name revalida-key \
 --public-key-material fileb://~/.ssh/revalida-key.pub \
 --region us-east-2 -->
