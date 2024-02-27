const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

//constantes 
const ubuntuAmiFilter = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*";
const ubuntuAmiOwner = "099720109477";
const ec2InstanceType = "t2.micro";
const ec2InstanceName = "SUMA Dashboard";
const keyPairName = "myKeyPair";
const securityGroupName = "SecurityGroupSSH";
const defaultSecurityGroupId = "sg-04012560748896c5c";

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
     publicKey: pulumi.secret("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCQJmU/QUsJ4oq0bisUeFk4Z+uaEINB0aIBIeXQ7D2a73PoX5a69sGy0tyKnmRqfRXiXmMaGH73Sq3rghocfhooTdD4PG484+n+ClUihVGIufow+eaAZIWrsH3YAi/3TiPa7FMVQRnHU+5tl7GbEasoAerntuNpzHqXx0hDUj/oP2LFf1a1nFUCOMswUaa1BtugqOv9BLJYdri25f+VGDEXIgIh/mz+VuolPB4ZdygaBhPpQ8aqkE3JRc8y8Qg3Xo6qK2LB9xBtmAaNlH/qcnmJNt06ZSvfeQKdZWAXseBebH+PQaqjZV0KUAdUepF1Gn/iHXnaO5Kx8jZUZ+uge5EVfghnMFWxjoiV+vdDq1PlWEEf7SYeFFWodl0AJ5BgEQVW5Kr6ha9Oy7egM9oqdW30zW1Gl6Xfr088VubG/5dnccHR53mmT7J3nFLScwysr5c69mbxtssAt1Sa5/95u7FynLEq5Gdo2+6klB5v4TjJJ7yctGCWyVrnEVCoH16ApF8/6lMECuZGpg0duer5vkwc7FkKWMLsHQynJQ9yg4XoTA8PqsegX6W2VXfaZVXz095L/W2SatIHNB7h1v+Rj7F/KHlPeSqlX+Ce7hzO1puZiAp1IOtetv1T1P8u6bltC9UmKD5v+svIy71L7/KEAPZt1w2Svey/9nXx2vP42ggbWw=="),
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
    {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
    },
    {
        protocol: "tcp",
        fromPort: 3306,
        toPort: 3306,
        cidrBlocks: ["0.0.0.0/0"],
    },
]);

// Configurar instancia EC2
const instanceConfig = {
    ami: ami.then(ami => ami.id),
    instanceType: ec2InstanceType,
    keyName: ec2KeyPair.keyName,
    vpcSecurityGroupIds: [secGroup.id, defaultSecurityGroupId],
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