const AWS = require('aws-sdk');
const hostile = require('hostile')
const props = require('./props.js')

const credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
AWS.config.credentials = credentials;
const params = {
    Filters: [
        {
            Name: "instance-type",
            Values: [
                "t2.micro"
            ]
        }
    ]
};

const ec2 = new AWS.EC2({ region: 'us-east-2' });

const awsUtils = []

awsUtils.describeAll = async () => {
    return new Promise((resolve, reject) => {
        ec2.describeInstances(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err)
            }
            else {
                resolve(data)
            }
        });
    })
}

awsUtils.describeFiltered = async (filterFunc) => {
    let data = await awsUtils.describeAll()

    let filteredList = data.Reservations.map(res => {
        let instance = {}
        instance.id = res.Instances[0].InstanceId
        instance.privateIp = res.Instances[0].PrivateIpAddress
        instance.dns = res.Instances[0].PublicDnsName
        instance.pubIp = res.Instances[0].PublicIpAddress
        instance.status = res.Instances[0].State.Name
        instance.name = res.Instances[0].Tags.find(tag => {
            return tag.Key === "Name"
        }).Value
        instance.index = res.Instances[0].Tags.find(tag => {
            return tag.Key.toLowerCase() === "index"
        })?.Value 
        instance.mongoHost = `srv${instance.index}.${props.mongo.domain}`
        return instance
    })

    if (filterFunc){
        filteredList = filteredList.filter(filterFunc)
    }

    return filteredList
}

awsUtils.shtudownInstancesByIdList = async (idList) => {
    let params = {
        InstanceIds: idList
    };
    return new Promise((resolve, reject) => {
        ec2.stopInstances(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}

awsUtils.shtudownAllInstances = async () => {
    let instances = await awsUtils.describeFiltered()
    let idList = instances.map(instance => instance.id)
    let data = await awsUtils.shtudownInstancesByIdList(idList)
    return data.StoppingInstances.map(inst => {
        let idStatus = {}
        idStatus.id = inst.InstanceId
        idStatus.status = inst.CurrentState.Name
        return idStatus
    })
}

awsUtils.startInstancesByIdList = async (idList) => {
    let params = {
        InstanceIds: idList
    };
    return new Promise((resolve, reject) => {
        ec2.startInstances(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}

awsUtils.startAllInstances = async () => {
    let instances = await awsUtils.describeFiltered()
    let idList = instances.map(instance => instance.id)
    let data = await awsUtils.startInstancesByIdList(idList)
    return data.StartingInstances.map(inst => {
        let idStatus = {}
        idStatus.id = inst.InstanceId
        idStatus.status = inst.CurrentState.Name
        return idStatus
    })
}

 awsUtils.waitStatus = {'run': 'instanceRunning'}
 awsUtils.waitFor = async (status, idList, callback) => {
    let params = {
        InstanceIds: idList
    };
    ec2.waitFor(status, params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        }
        else {
            console.log(`All instances in ${status}`);
            callback()
        }           
    });
}

module.exports = awsUtils