// Single UTXO import, from same wallet
export const ImportTransaction = `{
    "id": "2KL4TfCKyHYMxGfWSZkXpurYiDzwk9sASAH47RMikk53cZNNuY",
    "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
    "type": "import",
    "inputs": [
        {
            "output": {
                "id": "25qYtoa8iUs1C3fiFd5zVBgGkGKAy5cJAB8h3pZ9KEsFATrzvN",
                "transactionID": "2ZCs8ivLqFJMY95xfbjEvmmYHLRKJ482LRRhRHJTbh5ozgkTK",
                "outputIndex": 1,
                "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
                "stake": false,
                "frozen": false,
                "stakeableout": false,
                "genesisutxo": false,
                "outputType": 7,
                "amount": "10000001000000",
                "locktime": 0,
                "stakeLocktime": 0,
                "threshold": 1,
                "addresses": [
                    "fuji1nqz4gndscpdp6yr326sz0afdlylcj0g6mf0q46"
                ],
                "caddresses": null,
                "timestamp": "2021-09-22T21:09:12.080818Z",
                "redeemingTransactionID": "2KL4TfCKyHYMxGfWSZkXpurYiDzwk9sASAH47RMikk53cZNNuY",
                "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "inChainID": "11111111111111111111111111111111LpoYY",
                "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "groupID": 0,
                "payload": "",
                "block": "",
                "nonce": 0,
                "rewardUtxo": false
            },
            "credentials": [
                {
                    "address": "fuji1nqz4gndscpdp6yr326sz0afdlylcj0g6mf0q46",
                    "public_key": "Aq+k4JtTmzlCtC8uU9ENcPEWgjGYFCfzcdQXDtr4IlT7",
                    "signature": "+JDS2npkiUeUCJbd4omE42p84NxWrZesXbl6Xc/T2hgAWpavImf8q82O0iqpjsk+4V6d7vFZ7ljjxfyGbrdt5QA="
                }
            ]
        }
    ],
    "outputs": [
        {
            "id": "vz89wQkEvPkTuZCQNJZ4DX4Jd5UsDJCMM7WBgHcVLLbVv9rA9",
            "transactionID": "2KL4TfCKyHYMxGfWSZkXpurYiDzwk9sASAH47RMikk53cZNNuY",
            "outputIndex": 0,
            "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
            "stake": false,
            "frozen": false,
            "stakeableout": false,
            "genesisutxo": false,
            "outputType": 7,
            "amount": "10000000000000",
            "locktime": 0,
            "stakeLocktime": 0,
            "threshold": 1,
            "addresses": [
                "fuji1nqz4gndscpdp6yr326sz0afdlylcj0g6mf0q46"
            ],
            "caddresses": null,
            "timestamp": "2021-09-22T21:09:22.140212Z",
            "redeemingTransactionID": "sgX4P3HuZnNYZvaQFTrhCM1CUjDyzhJeDEhsMVi4JZ1YPjkJn",
            "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "inChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "groupID": 0,
            "payload": "",
            "block": "",
            "nonce": 0,
            "rewardUtxo": false
        }
    ],
    "memo": "",
    "inputTotals": {
        "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK": "10000001000000"
    },
    "outputTotals": {
        "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK": "10000000000000"
    },
    "reusedAddressTotals": null,
    "timestamp": "2021-09-22T21:09:22.140212Z",
    "txFee": 1000000,
    "genesis": false,
    "rewarded": false,
    "rewardedTime": null,
    "epoch": 0,
    "vertexId": "Nk3tnXwzna7TRHqZdcip9mYZsHfuxzVuwD7r9FprUEjnx73pX",
    "validatorNodeID": "",
    "validatorStart": 0,
    "validatorEnd": 0,
    "txBlockId": ""
}`;

/**
 * Multiple input UTXOs
 */
export const ImportTx1 = `{
    "id": "Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3",
    "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
    "type": "import",
    "inputs": [
        {
            "output": {
                "id": "2SWfaryWASwABQnLHo6csTmYzT32wc5SkMHauhwFxRu2wj9ZS1",
                "transactionID": "2Zu4HyHvNYZrHS4WuLWzWvnLRdudzxhrwAWio6dxWi9V8j1QZE",
                "outputIndex": 1,
                "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
                "stake": false,
                "frozen": false,
                "stakeableout": false,
                "genesisutxo": false,
                "outputType": 7,
                "amount": "1001000000",
                "locktime": 0,
                "stakeLocktime": 0,
                "threshold": 1,
                "addresses": [
                    "fuji16spahfywxkm2jw0nmag8wdaymg76cccw3hpr5g"
                ],
                "caddresses": null,
                "timestamp": "2021-09-22T14:53:28.682254Z",
                "redeemingTransactionID": "Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3",
                "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "inChainID": "11111111111111111111111111111111LpoYY",
                "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "groupID": 0,
                "payload": "",
                "block": "",
                "nonce": 0,
                "rewardUtxo": false
            },
            "credentials": [
                {
                    "address": "fuji16spahfywxkm2jw0nmag8wdaymg76cccw3hpr5g",
                    "public_key": "A8pS71G9B7Vxcj+Tl3w6HAzYkRVlGyaZx8DwbDy0VzQE",
                    "signature": "BaJNUuyjNMCaMu7KGF7PJD+egRluFHg/odbr5oHQxE4wqycts/c+v+kT/HKuay1kd20+Z2LdONbmUYRjWIpdhgA="
                }
            ]
        },
        {
            "output": {
                "id": "Fsz8Lowagfbt9MBrfqvMGR3D26o2RFuDQ2UYBPb6hGxCyuEQB",
                "transactionID": "Kzhv5zDBEvtFoMFyfbwauppBBULctQ81QkHwqTVRwfykbYVWY",
                "outputIndex": 1,
                "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
                "stake": false,
                "frozen": false,
                "stakeableout": false,
                "genesisutxo": false,
                "outputType": 7,
                "amount": "1001000000",
                "locktime": 0,
                "stakeLocktime": 0,
                "threshold": 1,
                "addresses": [
                    "fuji170mcu46k2rctpzrpe5vgk6nchhzfxt40kgcd2s"
                ],
                "caddresses": null,
                "timestamp": "2021-09-22T14:51:01.675742Z",
                "redeemingTransactionID": "Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3",
                "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "inChainID": "11111111111111111111111111111111LpoYY",
                "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "groupID": 0,
                "payload": "",
                "block": "",
                "nonce": 0,
                "rewardUtxo": false
            },
            "credentials": [
                {
                    "address": "fuji170mcu46k2rctpzrpe5vgk6nchhzfxt40kgcd2s",
                    "public_key": "AqSeXd3beQ9iQ9kUMEeh1y5oLuMqDP7K0I91L5bQ2VnW",
                    "signature": "jxg1Cv0nSPL0eBbDDq+2nC8WZ4dWMJJiarna697yWEB/msBQMk5dmDm6tPNOFGideb6lgBNdDTQfb9tGKbVTIAA="
                }
            ]
        },
        {
            "output": {
                "id": "kMpYcRJw8g8HGhwXifUAcoyeRSLCXFMY9N2ZbgLrCx11RsXAj",
                "transactionID": "2sTXUQJrxkaiLvK17vK11AyH4x2m4n6jJuAARepZQygNVS6WX4",
                "outputIndex": 1,
                "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
                "stake": false,
                "frozen": false,
                "stakeableout": false,
                "genesisutxo": false,
                "outputType": 7,
                "amount": "1001000000",
                "locktime": 0,
                "stakeLocktime": 0,
                "threshold": 1,
                "addresses": [
                    "fuji1kh2tklylfqg3fg2audd53kf2zdnrhamcac0hjk"
                ],
                "caddresses": null,
                "timestamp": "2021-09-22T15:29:00.285528Z",
                "redeemingTransactionID": "Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3",
                "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "inChainID": "11111111111111111111111111111111LpoYY",
                "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
                "groupID": 0,
                "payload": "",
                "block": "",
                "nonce": 0,
                "rewardUtxo": false
            },
            "credentials": [
                {
                    "address": "fuji1kh2tklylfqg3fg2audd53kf2zdnrhamcac0hjk",
                    "public_key": "AocSxsnd7Vm7M9b0G70yRVC5GoX6ebN7YwTPGoyf58Yb",
                    "signature": "mamBZA1CHofvE+YGaMTQujY5jmwt9008rIuy+uV24qBo3ZmB9DDWY8VuBddTIHR+zXiDYE4UuKi2EQEo74SBDQE="
                }
            ]
        }
    ],
    "outputs": [
        {
            "id": "w7VCmj68M1d528nkgfsPgQcGqW88fL8QQhWfE8J1qjqmX9cHQ",
            "transactionID": "Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3",
            "outputIndex": 0,
            "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
            "stake": false,
            "frozen": false,
            "stakeableout": false,
            "genesisutxo": false,
            "outputType": 7,
            "amount": "1000000000",
            "locktime": 0,
            "stakeLocktime": 0,
            "threshold": 1,
            "addresses": [
                "fuji1mj2x9eecn68weljg3tfaszem6hfx8yyq2kve2a"
            ],
            "caddresses": null,
            "timestamp": "2021-09-22T21:08:33.770254Z",
            "redeemingTransactionID": "",
            "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "inChainID": "",
            "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "groupID": 0,
            "payload": "",
            "block": "",
            "nonce": 0,
            "rewardUtxo": false
        },
        {
            "id": "tBwQq3sfe14HRmzoJeteQ1hKr8t5aN5QDvRgtLX7yrjsw8f5X",
            "transactionID": "Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3",
            "outputIndex": 1,
            "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
            "stake": false,
            "frozen": false,
            "stakeableout": false,
            "genesisutxo": false,
            "outputType": 7,
            "amount": "1001000000",
            "locktime": 0,
            "stakeLocktime": 0,
            "threshold": 1,
            "addresses": [
                "fuji1mj2x9eecn68weljg3tfaszem6hfx8yyq2kve2a"
            ],
            "caddresses": null,
            "timestamp": "2021-09-22T21:08:33.770254Z",
            "redeemingTransactionID": "",
            "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "inChainID": "",
            "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "groupID": 0,
            "payload": "",
            "block": "",
            "nonce": 0,
            "rewardUtxo": false
        },
        {
            "id": "2H7UTsEDVcSqs5khTyQscye2iE5noa1xc7Uoz7a1vFartqa5if",
            "transactionID": "Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3",
            "outputIndex": 2,
            "assetID": "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
            "stake": false,
            "frozen": false,
            "stakeableout": false,
            "genesisutxo": false,
            "outputType": 7,
            "amount": "1001000000",
            "locktime": 0,
            "stakeLocktime": 0,
            "threshold": 1,
            "addresses": [
                "fuji1mj2x9eecn68weljg3tfaszem6hfx8yyq2kve2a"
            ],
            "caddresses": null,
            "timestamp": "2021-09-22T21:08:33.770254Z",
            "redeemingTransactionID": "",
            "chainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "inChainID": "",
            "outChainID": "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
            "groupID": 0,
            "payload": "",
            "block": "",
            "nonce": 0,
            "rewardUtxo": false
        }
    ],
    "memo": "",
    "inputTotals": {
        "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK": "3003000000"
    },
    "outputTotals": {
        "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK": "3002000000"
    },
    "reusedAddressTotals": null,
    "timestamp": "2021-09-22T21:08:33.770254Z",
    "txFee": 1000000,
    "genesis": false,
    "rewarded": false,
    "rewardedTime": null,
    "epoch": 0,
    "vertexId": "2jhMUtWCZAVqu5nRTWiByMzXauQXHVQYpysD2A8VjrtiB1tuwH",
    "validatorNodeID": "",
    "validatorStart": 0,
    "validatorEnd": 0,
    "txBlockId": ""
}`;
