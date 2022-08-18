import { atom, DefaultValue, useRecoilCallback, useRecoilValue } from "recoil";
import { RecoilSync, syncEffect, RecoilURLSyncJSON } from "recoil-sync";
import { useState } from "react";
import { object, string } from "@recoiljs/refine";
import { mockRemoteStorage } from "./storage";

const INIT_FROM_PROPS_STORE_KEY = "INIT_FROM_PROPS_STORE_KEY";
const REMOTE_STORAGE_STORE_KEY = "REMOTE_STORAGE_STORE_KEY";
const URL_STORE_KEY = "URL_STORE_KEY";
const OBJ_ATOM_KEY = "OBJ_ATOM_KEY";

type Obj = {
  name: string;
  description: string;
};

const objAtomRefine = object({
  name: string(),
  description: string()
});

const objAtom = atom<Obj>({
  key: OBJ_ATOM_KEY,
  default: {
    name: "default name for atom",
    description: "default description for atom"
  },
  effects: [
    syncEffect({
      storeKey: REMOTE_STORAGE_STORE_KEY,
      syncDefault: true,
      refine: objAtomRefine
    }),
    syncEffect({
      storeKey: INIT_FROM_PROPS_STORE_KEY,
      syncDefault: true,
      refine: objAtomRefine
    }),
    syncEffect({
      storeKey: URL_STORE_KEY,
      syncDefault: true,
      refine: objAtomRefine
    })
  ]
});

const JsonizeObjAtom = () => {
  const obj = useRecoilValue(objAtom);
  const jsonize = JSON.stringify(obj);

  return (
    <div>
      jsonize atom: <pre>{jsonize}</pre>
    </div>
  );
};

// https://recoiljs.org/docs/recoil-sync/implement-store#example-syncing-with-react-props
const EffectManager: React.FC<{
  children: React.ReactNode;
  initialObj: Obj;
}> = ({ children, ...props }) => {
  return (
    <RecoilSync
      storeKey={INIT_FROM_PROPS_STORE_KEY}
      read={(itemKey) => {
        return props.initialObj;
      }}
    >
      <RecoilSync
        storeKey={REMOTE_STORAGE_STORE_KEY}
        read={() => mockRemoteStorage.get()}
        write={({ diff }) => {
          for (const [key, value] of diff) {
            // you can write some async logic to external store
            // https://recoiljs.org/docs/recoil-sync/implement-store#example-syncing-with-user-database
            console.log(
              "remote storage store -> received messages from atom effect",
              { key, value }
            );

            if (
              typeof value !== "object" ||
              value === null ||
              value === undefined ||
              value instanceof DefaultValue
            ) {
              return;
            }

            mockRemoteStorage.set(value);
          }
        }}
        listen={(cb) => {
          console.log("props change detected.");

          // can mutate atoms in below.
          // const subscription = mockRemoteStorage.subscribe((key, value) => {
          //   updateItem(key, value);
          // });
          // return () => subscription.release();

          // cb.updateItem(OBJ_ATOM_KEY, {
          //   name: "hoge",
          //   description: "bar"
          // });
        }}
      >
        <RecoilURLSyncJSON
          storeKey={URL_STORE_KEY}
          location={{ part: "queryParams" }}
        >
          {children}
        </RecoilURLSyncJSON>
      </RecoilSync>
    </RecoilSync>
  );
};

export const RecoilSyncTest: React.FC = () => {
  const [obj, setObj] = useState<Obj>({
    name: "initial local state name",
    description: "initial local state description"
  });

  const syncLocalToAtom = useRecoilCallback((cb) => () => {
    cb.set(objAtom, obj);
  });

  const dumpRemoteStorage = () => {
    console.log(mockRemoteStorage.get());
  };

  return (
    <>
      <div>
        <label>
          name:
          <input
            type="text"
            value={obj.name}
            onChange={(e) =>
              setObj((current) => ({ ...current, name: e.target.value }))
            }
          />
        </label>
      </div>

      <div>
        <label>
          description:
          <input
            type="text"
            value={obj.description}
            onChange={(e) =>
              setObj((current) => ({ ...current, description: e.target.value }))
            }
          />
        </label>
      </div>

      <div>
        <button onClick={syncLocalToAtom}>syncLocalToAtom</button>
      </div>

      <div>
        <button onClick={dumpRemoteStorage}>dumpRemoteStorage</button>
      </div>

      {/* atom initialized by <EffectManager/> */}
      <EffectManager initialObj={obj}>
        <JsonizeObjAtom />
      </EffectManager>
    </>
  );
};
