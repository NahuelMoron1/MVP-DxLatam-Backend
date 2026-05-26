#!/bin/bash

# Recibimos los parámetros
SSH_USER=$1
SSH_IP=$2
SSH_PASSWORD=$3
GITHUB_USERNAME=$4
GITHUB_TOKEN=$5

echo "Iniciando deployment FE..."

# Verificamos que tenemos los parámetros necesarios
if [ -z "$SSH_USER" ] || [ -z "$SSH_IP" ] || [ -z "$SSH_PASSWORD" ]; then
    echo "Error: Faltan parámetros SSH"
    exit 1
fi

# Método 1: Intentar con sshpass si está disponible
if command -v sshpass >/dev/null 2>&1; then
    echo "Usando sshpass..."
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SSH_USER@$SSH_IP << EOF
cd /home/pdk1gameprivate/htdocs/www.pdk1gameprivate.online
# Verificar el estado actual del repositorio
echo "Estado del repositorio:"
git status
echo "Remotes configurados:"
git remote -v
# Configurar git con credenciales directas
echo "Configurando remote con credenciales..."
git remote set-url origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/Paddock1-Private-FE-Builder.git
echo "Haciendo pull..."
git pull origin main
echo "Git pull completado exitosamente"
EOF
    EXIT_CODE=$?
else
    echo "sshpass no disponible, intentando método alternativo..."

    # Método 2: Usar expect si está disponible
    if command -v expect >/dev/null 2>&1; then
        echo "Usando expect..."
        expect << EOF
set timeout 30
spawn ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SSH_USER@$SSH_IP
expect "password:"
send "$SSH_PASSWORD\r"
expect "*\$ "
send "cd /home/pdk1gameprivate/htdocs/www.pdk1gameprivate.online\r"
expect "*\$ "
send "echo 'Estado del repositorio:'\r"
expect "*\$ "
send "git status\r"
expect "*\$ "
send "echo 'Remotes configurados:'\r"
expect "*\$ "
send "git remote -v\r"
expect "*\$ "
send "echo 'Configurando remote con credenciales...'\r"
expect "*\$ "
send "git remote set-url origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/Paddock1-Private-FE-Builder.git\r"
expect "*\$ "
send "echo 'Haciendo pull...'\r"
expect "*\$ "
send "git pull origin main\r"
expect "*\$ "
send "echo 'Git pull completado exitosamente'\r"
expect "*\$ "
send "exit\r"
expect eof
EOF
        EXIT_CODE=$?
    else
        echo "Error: Ni sshpass ni expect están disponibles en el sistema"
        exit 1
    fi
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo "FE Deploy realizado correctamente"
    exit 0
else
    echo "Error en FE Deploy"
    exit 1
fi