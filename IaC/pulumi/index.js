const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

//constantes 
const ubuntuAmiFilter = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*";
const ubuntuAmiOwner = "099720109477";
const ec2InstanceType = "t2.micro";
const ec2InstanceName = "SUMA Dashboard";
const keyPairName = "myKeyPair";
const securityGroupName = "SecurityGroupSSH";

// Función para crear un grupo de seguridad
function createSecurityGroup(name, ingressRules) {
    return new aws.ec2.SecurityGroup(name, {
         ingress: ingressRules,
     });
 }

 // Función para crear una instancia EC2
function createEC2Instance(name, config) {
    return new aws.ec2.Instance(name, config);
}

// Crear clave SSH
 const ec2KeyPair = new aws.ec2.KeyPair(keyPairName, {
     publicKey: pulumi.secret("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCZUGrum0B7Ucg0iITn2B1hW3Q9qiOJIyYU/g4QNAtzXQHYS2fOZWYpOSkR7x8FrACPzuOTpOFQEf97aPzFkqoRSucZzQVSB1FGshrVwb/bZHfwJjdVc44toIf8XeWc5W83fFxzg1i694D63Y9tzti4kJPOpmbpiPGDaxPnmKJyR9R0Fn010VkFHpRkcrVlNH/f0lZ30x5N02O/c/Ol6SbqKF8t50cFA/4smHZxIsqquWfLe3Xw/UeIkKENtV0uVAJwlb3QNRfzEHsAm/6XaB8CmOpwLPBhsPBJg3w7S5LKrhV6EzeBLZUthR+9ZlprEGqDiiutjWQf7NiBbJBQ7sp7"),
});

// Obtener la última AMI de Ubuntu
const ami = aws.ec2.getAmi({
    filters: [
        {
            name: "name",
            values: [ubuntuAmiFilter],
        },
    ],
    owners: [ubuntuAmiOwner],
    mostRecent: true,
});

// Crear grupo de seguridad
const secGroup = createSecurityGroup(securityGroupName, [
    {
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ["0.0.0.0/0"],
    },
    {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
    },
   
]);

// Configurar instancia EC2
const instanceConfig = {
    ami: ami.then(ami => ami.id),
    instanceType: ec2InstanceType,
    keyName: ec2KeyPair.keyName,
    vpcSecurityGroupIds: [secGroup.id,],
    rootBlockDevice: {
        volumeType: "gp2",
        volumeSize: 20,
    },
    tags: {
        Name: ec2InstanceName,
    },

};

// Crear instancia EC2
const server = createEC2Instance(ec2InstanceName, instanceConfig);

// // Crear Elastic IP
// const eip = new aws.ec2.Eip("myEip", {
//     instance: server.id,
// });

// Output de la dirección IP pública de la instancia y la Elastic IP
module.exports.instanceIpAddress = server.publicIp;
// module.exports.elasticIpAddress = eip.publicIp;
module.exports.keyPairName = ec2KeyPair.keyName;